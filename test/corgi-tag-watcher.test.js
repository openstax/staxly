import corgiTagWatcher from '../src/corgi-tag-watcher.js'

const nock = require('nock')
const { Probot, createProbot } = require('probot')

describe('tag trigger', () => {
  let app

  beforeEach(() => {
    nock.disableNetConnect()
    app = new Probot({ appId: 1234, cert: 'test', githubToken: 'test' })
    app.load(corgiTagWatcher)
  })

  afterEach(() => {
    nock.cleanAll()
    nock.enableNetConnect()
  })

  test('does nothing if payload.reftype is not tag', async () => {
    await app.receive({
      name: 'create',
      payload: {
        ref: 'foo123',
        ref_type: 'branch',
        master_branch: 'main',
        description: 'asdf'
      }
    })
    expect(nock.isDone()).toBe(true)
  })
})
