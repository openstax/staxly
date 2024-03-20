import changelog from './changelog.js'
import mergeBases from './merge-bases.js'
import trackVersions from './track-versions.js'
import slackStuff from './slack-stuff.js'
import addonSettings from 'probot-addon-settings'

const { IGNORE_FOR_TESTING } = process.env

export default (robot, { getRouter }) => {
  changelog(robot)
  mergeBases(robot)
  trackVersions(robot)

  // Addons that are noisy during tests
  /* istanbul ignore if */
  if (!IGNORE_FOR_TESTING) {
    slackStuff(robot)
  }

  // 3rd-party addons that we use
  addonSettings(robot)

  // Just for testing. Comment on an issue when the issue has a specific URL
  robot.on('issues.opened', async context => {
    if (context.payload.issue.url === 'https://api.github.com/repos/Codertocat/Hello-World/issues/2') {
      const issueComment = context.issue({ body: 'Thanks for opening this issue!' })
      return context.octokit.issues.createComment(issueComment)
    }
  })

  /* istanbul ignore if */
  if (getRouter) {
    // Add a ping route
    const app = getRouter('/staxly')
    app.get('/_ping', (req, res) => {
      res.send('Pong')
    })
  }
}
