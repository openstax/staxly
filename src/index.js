module.exports = (robot) => {
  robot.events.setMaxListeners(100) // Since we use multiple plugins

  // Plugins that we use
  require('./slack-stuff')(robot)
  require('project-bot')(robot)
  require('probot-settings')(robot)
  require('./changelog')(robot)
  require('autolabeler')(robot)
  require('first-pr-merge')(robot)
  require('new-issue-welcome')(robot)
  require('new-pr-welcome')(robot)
  require('request-info')(robot)
  require('release-notifier')(robot)

  console.log('Yay, the app was loaded!')

  // Add a ping route
  const app = robot.route('/staxly')
  app.get('/_ping', (req, res) => {
    res.end('Pong')
  })
}
