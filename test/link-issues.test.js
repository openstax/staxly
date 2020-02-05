const nock = require('nock')
const linkIssues = require('../src/link-issues')
const { createProbot } = require('probot')

describe('link issues', () => {
  let app

  beforeEach(() => {
    nock.disableNetConnect()
    app = createProbot({ id: 1, cert: 'test', githubToken: 'test' })
    app.load(linkIssues)
  })

  test('fails if there is no link', async () => {
    nock('https://api.github.com')
      .post('/repos/testowner/testrepo/check-runs')
      .reply(200, {id: 5})

    nock('https://api.github.com')
      .get('/repos/testowner/testrepo/pulls/2')
      .reply(200, {body: 'no link'})

    nock('https://api.github.com')
      .patch('/repos/testowner/testrepo/check-runs/5', body => body.conclusion === 'failure')
      .reply(200, {id: 5})

    await app.receive({
      name: 'pull_request.opened',
      payload: {
        pull_request: {
          number: 2,
          head: {
            sha: 'shashashashasha'
          }
        },
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

  test('passes if there is a link', async () => {
    nock('https://api.github.com')
      .post('/repos/testowner/testrepo/check-runs')
      .reply(200, {id: 5})

    nock('https://api.github.com')
      .get('/repos/testowner/testrepo/pulls/2')
      .reply(200, {body: 'link: openstax/rex-web#4'})

    nock('https://api.github.com')
      .patch('/repos/testowner/testrepo/check-runs/5', body => body.conclusion === 'success')
      .reply(200, {id: 5})

    await app.receive({
      name: 'pull_request.opened',
      payload: {
        pull_request: {
          number: 2,
          head: {
            sha: 'shashashashasha'
          }
        },
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
        pull_request: {
          number: 2,
          head: {
            sha: 'shashashashasha'
          }
        },
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
