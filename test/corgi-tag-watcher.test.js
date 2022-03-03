import corgiTagWatcher from '../src/corgi-tag-watcher.js'

const nock = require('nock')
const { Probot } = require('probot')

const base = {
  name: 'testrepo',
  owner: {
    login: 'testowner'
  }
}

describe('tag trigger', () => {
  let app, github, corgi, slack
  const jobsApi = '/api/jobs/'

  beforeEach(() => {
    nock.disableNetConnect()
    process.env.CORGI_HOSTNAME = 'corgi-hostname'
    process.env.CORGI_SLACK_SECRET = 'dummy-secret'

    app = new Probot({ appId: 1234, cert: 'test', githubToken: 'test' })
    app.load(corgiTagWatcher)

    const xml = `<container>
                        <book slug="book-slug1" style="business-ethics" href="../collections/book-slug1.collection.xml" />
                        <book slug="book-slug2" href="../collections/book-slug1.collection.xml" />
                        <book slug="book-slug3" style="" href="../collections/book-slug1.collection.xml" />
                    </container>`

    github = nock('https://api.github.com')
      .get('/repos/testowner/testrepo/contents/META-INF%2Fbooks.xml')
      .reply(200, {
        content: Buffer.from(xml).toString('base64'),
        encoding: 'base64'
      })

    corgi = nock('https://corgi-hostname')

    slack = nock('https://hooks.slack.com')
      .post('/services/dummy-secret')
      .reply(200, {})
  })

  afterEach(() => {
    nock.cleanAll()
  })

  describe('corgi job successfully queues', () => {
    beforeEach(() => {
      corgi = corgi
        .post(jobsApi, body => body.style === 'default')
        .times(6) // Two requests per slug
        .reply(200, {})
    })

    test('does nothing if payload.reftype is not tag', async () => {
      await app.receive({
        name: 'create',
        payload: {
          ref: 'refs/heads/main',
          ref_type: 'branch',
          master_branch: 'main',
          description: 'asdf',
          repository: base
        }
      })

      expect(corgi.isDone()).toBe(false)
      expect(github.isDone()).toBe(false)
    })

    test('queues job with corgi if payload.reftype is tag', async () => {
      await app.receive({
        name: 'create',
        payload: {
          ref: 'refs/heads/main',
          ref_type: 'tag',
          master_branch: 'main',
          description: 'asdf',
          repository: base
        }
      })

      expect(corgi.isDone()).toBe(true)
      expect(slack.isDone()).toBe(true)
    })

    test('notifies slack', async () => {
      await app.receive({
        name: 'create',
        payload: {
          ref: 'refs/heads/main',
          ref_type: 'tag',
          master_branch: 'main',
          description: 'asdf',
          repository: base
        }
      })

      expect(corgi.isDone()).toBe(true)
      expect(slack.isDone()).toBe(true)
    })
  })

  describe('corgi job fails to queue', () => {
    beforeEach(() => { corgi = corgi.post(jobsApi).reply(500, {}) })

    test('notifies slack', async () => {
      await app.receive({
        name: 'create',
        payload: {
          ref: 'refs/heads/main',
          ref_type: 'tag',
          master_branch: 'main',
          description: 'asdf',
          repository: base
        }
      })

      expect(slack.isDone()).toBe(true)
    })
  })
})
