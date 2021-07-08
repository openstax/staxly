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
        nock('https://api.github.com')
            .get('/repos/testowner/testrepo/contents/META-INF%2Fbooks.xml')
            .reply(200, {
                "content": Buffer.from(xml).toString('base64'),
                "encoding": "base64",
            })

        nock('https://corgi-hostname')
            .post('/api/jobs/')
            .reply(200, {})

        nock('https://hooks.slack.com')
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

        expect(nock.isDone()).toBe(true)
    })

    test('queues job with corgi if payload.reftype is tag', async () => { })
    test('notifies slack if corgi job successfully queues', async () => { })
    test('notifies slack if corgi job fails to queue', async () => { })

})