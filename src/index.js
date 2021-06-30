import changelog from './changelog.js'
import mergeBases from './merge-bases.js'
import linkIssues from './link-issues.js'
import autoMerge from './auto-merge.js'
import trackVersions from './track-versions.js'
import corgiTagWatcher from './corgi-tag-watcher.js'
import slackStuff from './slack-stuff.js'

const { IGNORE_FOR_TESTING } = process.env

export default (robot, { getRouter }) => {
  throw new Error("blargh")
  // robot.events.setMaxListeners(100) // Since we use multiple plugins

  changelog(robot)
  mergeBases(robot)
  linkIssues(robot)
  autoMerge(robot)
  trackVersions(robot)
  corgiTagWatcher(robot)

  // Addons that are noisy during tests
  if (!IGNORE_FOR_TESTING) {
    slackStuff(robot)
    //import('probot-addon-release-notifier').then(module => module.default(robot)) // because it uses safe-env and yells loudly
  }

  // Just for testing. Comment on an issue when the issue has a specific URL
  robot.on('issues.opened', async context => {
    if (context.payload.issue.url === 'https://api.github.com/repos/Codertocat/Hello-World/issues/2') {
      const issueComment = context.issue({ body: 'Thanks for opening this issue!' })
      return context.octokit.issues.createComment(issueComment)
    }
  })

  if (getRouter) {
    // Add a ping route
    const app = getRouter('/staxly')
    app.get('/_ping', (req, res) => {
      res.send('Pong')
    })
  }
}
