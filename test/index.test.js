// Requiring our app implementation
import myProbotApp from '../src/index.js'
const nock = require('nock')
const { Probot, ProbotOctokit } = require('probot')

const issuesOpenedPayload = require('./fixtures/issues.opened.json')

test('that we can run tests', () => {
  // your real tests go here
  expect(1 + 2 + 3).toBe(6)
})

describe('My Probot app', () => {
  let app, scope

  beforeEach(() => {
    nock.disableNetConnect()
    app = new Probot({
      githubToken: 'test',
      // Disable throttling & retrying requests for easier testing
      Octokit: ProbotOctokit.defaults({
        retry: { enabled: false },
        throttle: { enabled: false }
      })
    })

    myProbotApp(app, { test: 'notreal' })

    scope = nock('https://api.github.com')
      .post('/repos/Codertocat/Hello-World/issues/2/comments', (body) => {
        return true
      })
      .reply(200)
  })

  test('creates a comment when the magic issue is opened', async () => {
    // Simulates delivery of an issues.opened webhook
    await app.receive({
      name: 'issues.opened',
      payload: issuesOpenedPayload
    })

    // This test passes if the code in your index.js file calls `context.octokit.issues.createComment`
    expect(scope.isDone()).toBe(true)
  })

  test('does not create a comment when a regular issue is opened', async () => {
    // Simulates delivery of an issues.opened webhook
    issuesOpenedPayload.issue.url = 'something-else'
    await app.receive({
      name: 'issues.opened',
      payload: issuesOpenedPayload
    })

    // This test passes if the code in your index.js file DOES NOT call `context.octokit.issues.createComment`
    expect(scope.isDone()).toBe(false)
  })
})

// For more information about testing with Jest see:
// https://facebook.github.io/jest/
