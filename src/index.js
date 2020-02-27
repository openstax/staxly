const {IGNORE_FOR_TESTING} = process.env

module.exports = (robot) => {
  robot.events.setMaxListeners(100) // Since we use multiple plugins

  require('./changelog')(robot)
  require('./merge-bases')(robot)
  require('./link-issues')(robot)
  require('./auto-merge')(robot)

  // Addons that are noisy during tests
  if (!IGNORE_FOR_TESTING) {
    require('./slack-stuff')(robot)
    require('probot-addon-release-notifier')(robot) // because it uses safe-env and yells loudly
  }

  // 3rd-party addons that we use
  require('probot-addon-settings')(robot)

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
