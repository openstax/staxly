import trackVersions from '../src/track-versions.js'

const nock = require('nock')
const { createProbot } = require('probot')

jest.mock('../src/utils/versionsBlock', () => ({
  setVersion: jest.fn()
}))

const {setVersion} = require('../src/utils/versionsBlock')

describe('track-versions', () => {
  let app

  beforeEach(() => {
    nock.disableNetConnect()
    app = createProbot({ id: 1, cert: 'test', githubToken: 'test' })
    app.load(trackVersions)
  })

  test('updates issues', async () => {
    nock('https://api.github.com')
      .get('/repos/testowner/testrepo/issues')
      .query({'labels': 'release', 'state': 'open'})
      .reply(200, [{number: 5, body: 'body', labels: []}])

    nock('https://api.github.com')
      .patch('/repos/testowner/testrepo/issues/5', request => request.body === 'newbody')
      .reply(200, {number: 5})

    setVersion.mockReturnValue('newbody')

    await app.receive({
      name: 'push',
      payload: {
        ref: 'refs/heads/master',
        after: 'asdfasdfasdfasdfasdf',
        repository: {
          name: 'testrepo',
          full_name: 'testowner/testrepo',
          owner: {
            name: 'testowner'
          }
        }
      }
    })

    expect(setVersion).toHaveBeenCalledWith('body', 'testowner/testrepo', 'asdfasdfasdfasdfasdf')

    expect(nock.isDone()).toBe(true)
  })

  test('updates issues from other repo', async () => {
    nock('https://api.github.com')
      .get('/repos/testowner/testrepo/issues')
      .query({'labels': 'release', 'state': 'open'})
      .reply(200, [{number: 5, body: 'body', labels: []}])

    nock('https://api.github.com')
      .patch('/repos/testowner/testrepo/issues/5', request => request.body === 'newbody')
      .reply(200, {number: 5})

    setVersion.mockReturnValue('newbody')

    await app.receive({
      name: 'push',
      payload: {
        ref: 'refs/heads/master',
        after: 'asdfasdfasdfasdfasdf',
        repository: {
          name: 'testotherrepo',
          full_name: 'testowner/testotherrepo',
          owner: {
            name: 'testowner'
          }
        }
      }
    })

    expect(setVersion).toHaveBeenCalledWith('body', 'testowner/testotherrepo', 'asdfasdfasdfasdfasdf')

    expect(nock.isDone()).toBe(true)
  })

  test('skips issues with "locked" label', async () => {
    nock('https://api.github.com')
      .get('/repos/testowner/testrepo/issues')
      .query({'labels': 'release', 'state': 'open'})
      .reply(200, [{number: 5, body: 'body', labels: [{name: 'locked'}]}])

    await app.receive({
      name: 'push',
      payload: {
        ref: 'refs/heads/master',
        after: 'asdfasdfasdfasdfasdf',
        repository: {
          name: 'testotherrepo',
          full_name: 'testowner/testotherrepo',
          owner: {
            name: 'testowner'
          }
        }
      }
    })

    expect(nock.isDone()).toBe(true)
  })

  test('noops outside whitelist', async () => {
    await app.receive({
      name: 'push',
      payload: {
        ref: 'refs/heads/master',
        after: 'asdfasdfasdfasdfasdf',
        repository: {
          full_name: 'testowner/randomrepo',
          name: 'randomrepo',
          owner: {
            name: 'testowner'
          }
        }
      }
    })

    expect(nock.isDone()).toBe(true)
  })

  afterEach(() => {
    nock.cleanAll()
    nock.enableNetConnect()
  })
})
