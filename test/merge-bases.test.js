const nock = require('nock')
const mergeBases = require('../src/merge-bases')
const { createProbot } = require('probot')

describe('My Probot app', () => {
  let app

  beforeEach(() => {
    nock.disableNetConnect()
    app = createProbot({ id: 1, cert: 'test', githubToken: 'test' })
    app.load(mergeBases)
  })

  test('updates branch', async () => {
    nock('https://api.github.com')
      .get('/repos/testowner/testrepo/pulls?base=master&state=open')
      .reply(200, [{number: 5}])

    nock('https://api.github.com')
      .put('/repos/testowner/testrepo/pulls/5/update-branch')
      .reply(200, {number: 5})

    // Simulates delivery of an issues.opened webhook
    await app.receive({
      name: 'push',
      payload: {
        ref: 'refs/heads/master',
        repository: {
          name: 'testrepo',
          owner: {
            name: 'testowner'
          }
        }
      }
    })

    expect(nock.isDone()).toBe(true)
  })

  test('skips draft', async () => {
    nock('https://api.github.com')
      .get('/repos/testowner/testrepo/pulls?base=master&state=open')
      .reply(200, [{number: 5, draft: true}])

    // Simulates delivery of an issues.opened webhook
    await app.receive({
      name: 'push',
      payload: {
        ref: 'refs/heads/master',
        repository: {
          name: 'testrepo',
          owner: {
            name: 'testowner'
          }
        }
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
        repository: {
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
