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
      .patch('/repos/testowner/testrepo/check-runs/5', body => body.conclusion === 'failure')
      .reply(200, {id: 5})

    await app.receive({
      name: 'pull_request.opened',
      payload: {
        pull_request: {
          number: 2,
          body: 'no link',
          head: {
            sha: 'shashashashasha'
          }
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

  test('fails with an invalid link', async () => {
    nock('https://api.github.com')
      .post('/repos/testowner/testrepo/check-runs')
      .reply(200, {id: 5})

    nock('https://api.github.com')
      .get('/repos/openstax/rex-web/issues/4')
      .reply(404, {})

    nock('https://api.github.com')
      .patch('/repos/testowner/testrepo/check-runs/5', body => body.conclusion === 'failure')
      .reply(200, {id: 5})

    await app.receive({
      name: 'pull_request.opened',
      payload: {
        pull_request: {
          number: 2,
          body: 'for: openstax/rex-web#4',
          head: {
            sha: 'shashashashasha'
          }
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

  test('passes if there is a link', async () => {
    const repo = {
      name: 'testrepo',
      owner: {
        login: 'testowner'
      }
    }
    nock('https://api.github.com')
      .post('/repos/testowner/testrepo/check-runs')
      .reply(200, {id: 5})

    nock('https://api.github.com')
      .get('/repos/openstax/rex-web/issues/123')
      .reply(200, {body: 'pull requests:\n- [ ] testowner/testrepo#2'})

    nock('https://api.github.com')
      .patch('/repos/testowner/testrepo/check-runs/5', body => body.conclusion === 'success')
      .reply(200, {id: 5})

    await app.receive({
      name: 'pull_request.opened',
      action: 'created',
      payload: {
        pull_request: {
          number: 2,
          body: 'asdf\nfor: openstax/rex-web#123',
          head: {
            sha: 'shashashashasha'
          },
          base: { repo }
        },
        repository: repo
      }
    })

    expect(nock.isDone()).toBe(true)
  })

  test('links to the issue if it isn\'t already', async () => {
    const repo = {
      name: 'testrepo',
      owner: {
        login: 'testowner'
      }
    }
    nock('https://api.github.com')
      .post('/repos/testowner/testrepo/check-runs')
      .reply(200, {id: 5})

    nock('https://api.github.com')
      .get('/repos/openstax/rex-web/issues/123')
      .reply(200, {body: '', repo: {name: 'rex-web', owner: {login: 'openstax'}}, number: 123})

    nock('https://api.github.com')
      .patch('/repos/testowner/testrepo/check-runs/5', body => body.conclusion === 'success')
      .reply(200, {id: 5})

    nock('https://api.github.com')
      .patch('/repos/openstax/rex-web/issues/123', body => body.body === '\n\npull requests:\n- [ ] testowner/testrepo#2')
      .reply(200, {})

    await app.receive({
      name: 'pull_request.opened',
      action: 'created',
      payload: {
        pull_request: {
          number: 2,
          body: 'asdf\nfor: openstax/rex-web#123',
          head: {
            sha: 'shashashashasha'
          },
          base: { repo }
        },
        repository: repo
      }
    })

    expect(nock.isDone()).toBe(true)
  })

  test('removes link from previous issue if link is changed', async () => {
    const repo = {
      name: 'testrepo',
      owner: {
        login: 'testowner'
      }
    }
    nock('https://api.github.com')
      .post('/repos/testowner/testrepo/check-runs')
      .reply(200, {id: 5})

    nock('https://api.github.com')
      .get('/repos/openstax/rex-web/issues/123')
      .reply(200, {body: '', repo: {name: 'rex-web', owner: {login: 'openstax'}}, number: 123})

    nock('https://api.github.com')
      .patch('/repos/testowner/testrepo/check-runs/5', body => body.conclusion === 'success')
      .reply(200, {id: 5})

    nock('https://api.github.com')
      .get('/repos/openstax/rex-web/issues/234')
      .reply(200, {body: 'pull requests:\n- [ ] testowner/testrepo#2', repo: {name: 'rex-web', owner: {login: 'openstax'}}, number: 234})

    nock('https://api.github.com')
      .patch('/repos/openstax/rex-web/issues/234', body => body.body === 'pull requests:')
      .reply(200, {})

    nock('https://api.github.com')
      .patch('/repos/openstax/rex-web/issues/123', body => body.body === '\n\npull requests:\n- [ ] testowner/testrepo#2')
      .reply(200, {})

    await app.receive({
      name: 'pull_request.opened',
      payload: {
        action: 'edited',
        changes: {
          body: {
            from: 'for: openstax/rex-web#234'
          }
        },
        pull_request: {
          number: 2,
          body: 'for: openstax/rex-web#123',
          head: {
            sha: 'shashashashasha'
          },
          base: { repo }
        },
        repository: repo
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
            login: 'testowner'
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
