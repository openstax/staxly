import autoMerge from '../src/auto-merge.js'

jest.mock('../src/utils/prIsReadyForAutoMerge', () => ({
  prIsReadyForAutoMerge: jest.fn(),
  readyToMergeLabel: 'ready to merge'
}))
jest.mock('../src/utils/getConnectedPRsForIssue')

const nock = require('nock')
const { createProbot } = require('probot')
const { prIsReadyForAutoMerge } = require('../src/utils/prIsReadyForAutoMerge')

describe('auto merge', () => {
  let app

  beforeEach(() => {
    nock.disableNetConnect()
    app = createProbot({ id: 1, cert: 'test', githubToken: 'test' })
    app.load(autoMerge)
  })

  afterEach(() => {
    nock.cleanAll()
    nock.enableNetConnect()
  })

  test('passes after check run completes', async () => {
    nock('https://api.github.com')
      .get('/repos/testowner/testrepo/pulls/2')
      .reply(200, {number: 2, draft: false, state: 'open'})

    nock('https://api.github.com')
      .put('/repos/testowner/testrepo/pulls/2/merge')
      .reply(200, {message: 'merged pr'})

    nock('https://api.github.com')
      .delete('/repos/testowner/testrepo/issues/2/labels/ready%20to%20merge')
      .reply(200)

    prIsReadyForAutoMerge.mockReturnValue(true)

    await app.receive({
      name: 'check_suite.completed',
      payload: {
        check_suite: {
          pull_requests: [{
            number: 2
          }],
        },
        repository: {
          name: 'testrepo',
          owner: {
            login: 'testowner'
          }
        }
      }
    })

    expect(nock.isDone()).toBe(true)
  })

  test('passes after commit status updated', async () => {
    nock('https://api.github.com')
      .get('/repos/testowner/testrepo/pulls')
      .query({'head': 'openstax:coolbranch'})
      .reply(200, [{number: 2, draft: false, state: 'open'}])

    nock('https://api.github.com')
      .put('/repos/testowner/testrepo/pulls/2/merge')
      .reply(200, {message: 'merged pr'})

    nock('https://api.github.com')
      .delete('/repos/testowner/testrepo/issues/2/labels/ready%20to%20merge')
      .reply(200)

    prIsReadyForAutoMerge.mockReturnValue(true)

    await app.receive({
      name: 'status',
      payload: {
        branches: [{
          name: 'coolbranch'
        }],
        repository: {
          name: 'testrepo',
          owner: {
            login: 'testowner'
          }
        }
      }
    })

    expect(nock.isDone()).toBe(true)
  })

  test('does nothing when merged', async () => {
    nock('https://api.github.com')
      .get('/repos/testowner/testrepo/pulls/2')
      .reply(200, {number: 2, draft: false, state: 'merged'})

    prIsReadyForAutoMerge.mockReturnValue(true)

    await app.receive({
      name: 'check_suite.completed',
      payload: {
        check_suite: {
          pull_requests: [{
            number: 2
          }]
        },
        repository: {
          name: 'testrepo',
          owner: {
            login: 'testowner'
          }
        }
      }
    })

    expect(nock.isDone()).toBe(true)
  })

  test('does nothing when not ready', async () => {
    nock('https://api.github.com')
      .get('/repos/testowner/testrepo/pulls/2')
      .reply(200, {number: 2, draft: false, state: 'open'})

    prIsReadyForAutoMerge.mockReturnValue(false)

    await app.receive({
      name: 'check_suite.completed',
      payload: {
        check_suite: {
          pull_requests: [{
            number: 2
          }]
        },
        repository: {
          name: 'testrepo',
          owner: {
            login: 'testowner'
          }
        }
      }
    })

    expect(nock.isDone()).toBe(true)
  })

  test('noops outside whitelist', async () => {
    await app.receive({
      name: 'check_suite.completed',
      payload: {
        pull_requests: [{
          number: 2
        }],
        repository: {
          name: 'randomrepo',
          owner: {
            login: 'testowner'
          }
        }
      }
    })

    expect(nock.isDone()).toBe(true)
  })
})
