import linkIssues from '../src/link-issues.js'
const nock = require('nock')
const probot = require('probot')

describe('link issues', () => {
  let app

  beforeEach(() => {
    nock.disableNetConnect()
    app = probot.createProbot({ id: 1, cert: 'test', githubToken: 'test' })
    app.load(linkIssues)
  })

  test('fails if there is no link', async () => {
    nock('https://api.github.com')
      .post('/repos/testowner/testrepo/check-runs')
      .reply(200, { id: 5 })

    nock('https://api.github.com')
      .patch('/repos/testowner/testrepo/check-runs/5', body => body.conclusion === 'failure')
      .reply(200, { id: 5 })

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
      .reply(200, { id: 5 })

    nock('https://api.github.com')
      .get('/repos/openstax/rex-web/issues/4')
      .reply(404, {})

    nock('https://api.github.com')
      .patch('/repos/testowner/testrepo/check-runs/5', body => body.conclusion === 'failure')
      .reply(200, { id: 5 })

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

  test('fails with an invalid link (long body)', async () => {
    nock('https://api.github.com')
      .post('/repos/openstax/rex-web/check-runs')
      .reply(200, { id: 5 })

    nock('https://api.github.com')
      .patch('/repos/openstax/rex-web/check-runs/5', body => body.conclusion === 'failure')
      .reply(200, { id: 5 })

    await app.receive({
      name: 'pull_request.edited',
      payload: {
        changes: {
        },
        pull_request: {
          number: 2,
          body: '(this was part of investigating what needs to be added to make book styles more useful)\r\nRefs https://github.com/openstax/unified-issues/issues/60\r\n\r\nWhen the link contains a `#` and targets a specific element, highlight the element.\r\n\r\nThis is particularly helpful for things like linking to a solution in the back of the book, discussing just a table, or seeing a specific footnote.\r\n\r\n# Examples\r\n\r\n## A Term (from the index)\r\n\r\n1. Click a link in the index: For example, https://rex-web-pr-56.herokuapp.com/books/college-physics/pages/26-6-aberrations#term676\r\n  - You might need to refresh the page to see it (because of SinglePageApp quirkiness)\r\n\r\n![image](https://user-images.githubusercontent.com/253202/50183719-89d2dd00-02d8-11e9-8bb4-04ce8f49eed5.png)\r\n\r\n## A Table\r\n\r\nExample: https://rex-web-pr-56.herokuapp.com/books/college-physics/pages/11-6-gauge-pressure-absolute-pressure-and-pressure-measurement#eip-286\r\n\r\n![image](https://user-images.githubusercontent.com/253202/50183544-0fa25880-02d8-11e9-9daa-8a2983900ab0.png)\r\n\r\n',
          head: {
            sha: 'shashashashasha'
          }
        },
        repository: {
          name: 'rex-web',
          owner: {
            login: 'openstax'
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
      .reply(200, { id: 5 })

    nock('https://api.github.com')
      .get('/repos/openstax/rex-web/issues/123')
      .reply(200, { body: 'pull requests:\n- [ ] testowner/testrepo#2' })

    nock('https://api.github.com')
      .patch('/repos/testowner/testrepo/check-runs/5', body => body.conclusion === 'success')
      .reply(200, { id: 5 })

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
      .reply(200, { id: 5 })

    nock('https://api.github.com')
      .get('/repos/openstax/rex-web/issues/123')
      .reply(200, { body: '', repo: { name: 'rex-web', owner: { login: 'openstax' } }, number: 123 })

    nock('https://api.github.com')
      .patch('/repos/testowner/testrepo/check-runs/5', body => body.conclusion === 'success')
      .reply(200, { id: 5 })

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
      .reply(200, { id: 5 })

    nock('https://api.github.com')
      .get('/repos/openstax/rex-web/issues/123')
      .reply(200, { body: '', repo: { name: 'rex-web', owner: { login: 'openstax' } }, number: 123 })

    nock('https://api.github.com')
      .patch('/repos/testowner/testrepo/check-runs/5', body => body.conclusion === 'success')
      .reply(200, { id: 5 })

    nock('https://api.github.com')
      .get('/repos/openstax/rex-web/issues/234')
      .reply(200, { body: 'pull requests:\n- [ ] testowner/testrepo#2', repo: { name: 'rex-web', owner: { login: 'openstax' } }, number: 234 })

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
