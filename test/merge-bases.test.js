import mergeBases from '../src/merge-bases.js'

const nock = require('nock')
const { Probot } = require('probot')

const base = {
  name: 'testrepo',
  owner: {
    login: 'testowner'
  }
}
describe('My Probot app', () => {
  let app

  beforeEach(() => {
    nock.disableNetConnect()
    app = new Probot({ appId: 1234, cert: 'test', githubToken: 'test' })
    app.load(mergeBases)
  })

  test('updates branch', async () => {
    nock('https://api.github.com')
      .get('/repos/testowner/testrepo/pulls?base=master&state=open')
      .reply(200, [{ number: 5, base }])

    nock('https://api.github.com')
      .put('/repos/testowner/testrepo/pulls/5/update-branch')
      .reply(200, { number: 5 })

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
    nock('https://api.github.com')
      .get('/repos/testowner/testrepo/pulls?base=master&state=open')
      .reply(200, [{ number: 5, base, draft: true }])

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
    // Simulates delivery of an issues.opened webhook
    await app.receive({
      name: 'push',
      payload: {
        ref: 'refs/heads/master',
        repository: { ...base, name: 'randomrepo' }
      }
    })

    expect(nock.isDone()).toBe(true)
  })

  afterEach(() => {
    nock.cleanAll()
    nock.enableNetConnect()
  })
})
