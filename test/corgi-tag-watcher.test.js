import corgiTagWatcher from '../src/corgi-tag-watcher.js'

const nock = require('nock')
const { Probot, createProbot } = require('probot')

const base = {
  name: 'testrepo',
  owner: {
    login: 'testowner'
  }
}

describe('tag trigger', () => {
  let app

  beforeEach(() => {
    nock.disableNetConnect()
    process.env.CORGI_HOSTNAME = 'corgi-hostname'
    process.env.CORGI_SLACK_SECRET = 'dummy-secret'

    app = new Probot({ appId: 1234, cert: 'test', githubToken: 'test' })
    app.load(corgiTagWatcher)
  })

  afterEach(() => {
    nock.cleanAll()
  })

  test('does nothing if payload.reftype is not tag', async () => {
    const xml = `<container>
                        <book slug="book-slug1" href="../collections/book-slug1.collection.xml" />
                    </container>`
    const github = nock('https://api.github.com')
      .get('/repos/testowner/testrepo/contents/META-INF%2Fbooks.xml')
      .reply(200, {
        content: Buffer.from(xml).toString('base64'),
        encoding: 'base64'
      })

    const corgi = nock('https://corgi-hostname')
      .post('/api/jobs/')
      .reply(200, {})

    const slack = nock('https://hooks.slack.com')
      .post('/services/dummy-secret')
      .reply(200, {})

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

    expect(github.isDone()).toBe(false)
  })

  test('queues job with corgi if payload.reftype is tag', async () => {
    const xml = `<container>
                        <book slug="book-slug1" href="../collections/book-slug1.collection.xml" />
                    </container>`
    const github = nock('https://api.github.com')
      .get('/repos/testowner/testrepo/contents/META-INF%2Fbooks.xml')
      .reply(200, {
        content: Buffer.from(xml).toString('base64'),
        encoding: 'base64'
      })

    const corgi = nock('https://corgi-hostname')
      .post('/api/jobs/')
      .reply(200, {})

    const slack = nock('https://hooks.slack.com')
      .post('/services/dummy-secret')
      .reply(200, {})

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
  })

  test('notifies slack if corgi job successfully queues', async () => {
    const xml = `<container>
                        <book slug="book-slug1" href="../collections/book-slug1.collection.xml" />
                    </container>`
    const github = nock('https://api.github.com')
      .get('/repos/testowner/testrepo/contents/META-INF%2Fbooks.xml')
      .reply(200, {
        content: Buffer.from(xml).toString('base64'),
        encoding: 'base64'
      })

    const corgi = nock('https://corgi-hostname')
      .post('/api/jobs/')
      .reply(200, {})

    const slack = nock('https://hooks.slack.com')
      .post('/services/dummy-secret')
      .reply(200, {})

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
  test('notifies slack if corgi job fails to queue', async () => {
    const xml = `<container>
                        <book slug="book-slug1" href="../collections/book-slug1.collection.xml" />
                    </container>`
    const github = nock('https://api.github.com')
      .get('/repos/testowner/testrepo/contents/META-INF%2Fbooks.xml')
      .reply(200, {
        content: Buffer.from(xml).toString('base64'),
        encoding: 'base64'
      })

    const corgi = nock('https://corgi-hostname')
      .post('/api/jobs/')
      .reply(500, {})

    const slack = nock('https://hooks.slack.com')
      .post('/services/dummy-secret')
      .reply(200, {})

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
