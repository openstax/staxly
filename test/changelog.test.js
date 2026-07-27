import changelog from '../src/changelog.js'
import nock from 'nock'
import { Probot } from 'probot'

const repository = {
  name: 'testrepo',
  owner: {
    login: 'testowner'
  }
}

const pullRequestPayload = {
  action: 'opened',
  number: 7,
  pull_request: {
    number: 7,
    html_url: 'https://github.com/testowner/testrepo/pull/7',
    head: { sha: 'abc123' }
  },
  repository
}

describe('changelog', () => {
  let app

  beforeEach(() => {
    nock.disableNetConnect()
    app = new Probot({ appId: 1234, cert: 'test', githubToken: 'test' })
    app.load(changelog)
  })

  afterEach(() => {
    nock.cleanAll()
    nock.enableNetConnect()
  })

  test('sets a success status when the PR includes a changelog entry', async () => {
    nock('https://api.github.com')
      .get('/repos/testowner/testrepo/contents/.github%2Fconfig.yml')
      .reply(200, 'changelog: {}\n')

    nock('https://api.github.com')
      .get('/repos/testowner/testrepo/pulls/7/files')
      .reply(200, [{ filename: 'CHANGELOG.md', status: 'modified' }])

    nock('https://api.github.com')
      .get('/repos/testowner/testrepo/issues/7/labels')
      .reply(200, [])

    const status = nock('https://api.github.com')
      .post('/repos/testowner/testrepo/statuses/abc123', (body) => {
        return body.state === 'success' && body.context === 'changelog'
      })
      .reply(201)

    await app.receive({ name: 'pull_request', payload: pullRequestPayload })

    expect(status.isDone()).toBe(true)
  })

  test('does nothing when there is no changelog config', async () => {
    const config = nock('https://api.github.com')
      .get('/repos/testowner/testrepo/contents/.github%2Fconfig.yml')
      .reply(200, 'foo: bar\n')

    await app.receive({ name: 'pull_request', payload: pullRequestPayload })

    expect(config.isDone()).toBe(true)
  })
})
