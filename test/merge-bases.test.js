import mergeBases from '../src/merge-bases.js'
import * as prIsReadyForAutoMerge from '../src/utils/prIsReadyForAutoMerge.js'

const nock = require('nock')
const { createProbot } = require('probot')

const base = {
  name: 'testrepo',
  owner: {
    login: 'testowner'
  }
}
describe('My Probot app', () => {
  let app, isReady

  beforeEach(() => {
    isReady = jest.spyOn(prIsReadyForAutoMerge, 'prIsReadyForAutoMerge')
    nock.disableNetConnect()
    app = createProbot({ id: 1, cert: 'test', githubToken: 'test' })
    app.load(mergeBases)
  })

  test('updates branch', async () => {
    isReady.mockReturnValue(Promise.resolve(true))

    nock('https://api.github.com')
      .get('/repos/testowner/testrepo/pulls?base=master&state=open')
      .reply(200, [{number: 5, base}])

    nock('https://api.github.com')
      .put('/repos/testowner/testrepo/pulls/5/update-branch')
      .reply(200, {number: 5})

    // Simulates delivery of an issues.opened webhook
    await app.receive({
      name: 'push',
      payload: {
        ref: 'refs/heads/master',
        repository: base
      }
    })

    expect(nock.isDone()).toBe(true)
  })

  test('skips draft', async () => {
    isReady.mockReturnValue(Promise.resolve(false))

    nock('https://api.github.com')
      .get('/repos/testowner/testrepo/pulls?base=master&state=open')
      .reply(200, [{number: 5, base}])

    // Simulates delivery of an issues.opened webhook
    await app.receive({
      name: 'push',
      payload: {
        ref: 'refs/heads/master',
        repository: base
      }
    })

    expect(nock.isDone()).toBe(true)
  })

  test('noops outside whitelist', async () => {
    isReady.mockReturnValue(Promise.resolve(true))

    // Simulates delivery of an issues.opened webhook
    await app.receive({
      name: 'push',
      payload: {
        ref: 'refs/heads/master',
        repository: {...base, name: 'randomrepo'}
      }
    })

    expect(nock.isDone()).toBe(true)
  })

  afterEach(() => {
    nock.cleanAll()
    nock.enableNetConnect()
  })
})
