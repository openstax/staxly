import changelog from './changelog'
import mergeBases from './merge-bases'
import linkIssues from './link-issues'
import autoMerge from './auto-merge'
import trackVersions from './track-versions'
import slackStuff from './slack-stuff'
import releaseNotifier from 'probot-addon-release-notifier'
import addonSettings from 'probot-addon-settings'

const {IGNORE_FOR_TESTING} = process.env

export default (robot) => {
  robot.events.setMaxListeners(100) // Since we use multiple plugins

  changelog(robot)
  mergeBases(robot)
  linkIssues(robot)
  autoMerge(robot)
  trackVersions(robot)

  // Addons that are noisy during tests
  if (!IGNORE_FOR_TESTING) {
    slackStuff(robot)
    releaseNotifier(robot) // because it uses safe-env and yells loudly
  }

  // 3rd-party addons that we use
  addonSettings(robot);

  // Just for testing. Comment on an issue when the issue has a specific URL
  robot.on('issues.opened', async context => {
    if (context.payload.issue.url === 'https://api.github.com/repos/Codertocat/Hello-World/issues/2') {
      const issueComment = context.issue({ body: 'Thanks for opening this issue!' })
      return context.github.issues.createComment(issueComment)
    }
  })

  // Add a ping route
  const app = robot.route('/staxly')
  app.get('/_ping', (req, res) => {
    res.end('Pong')
  })
}
