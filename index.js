const SLACK_CHANNEL_REGEXP = /<#([^>|]+)\|([^>]+)>/g // Parse "foo <#C0LA54Q5C|book-tools> bar"
const CRITSIT_PREFIX_REGEXP = /^[xy]-/ // Any channel beginning with "x-" or "y-" is a critsit and don't try to invite myself to that channel

module.exports = (robot) => {
  // Plugins that we use
  require('./src/slack-api')(robot)
  require('autolabeler')(robot)
  require('first-pr-merge')(robot)
  require('new-issue-welcome')(robot)
  require('new-pr-welcome')(robot)
  require('request-info')(robot)
  require('unfurl')(robot)
  require('probot-app-todos')(robot)
  require('release-notifier')(robot)
  require('wip-bot')(robot)

  console.log('Yay, the app was loaded!')

  robot.on('push', async (context) => {
    robot.log('pushed code. TODO: Do something smart instead of just logging')
  })

  //
  // React with a :wave: when a new message contains "staxly" or when an edited message contains "staxly"
  //
  async function waveWhenMentioned ({text, ts, channel}, slackWeb) {
    if (/staxly/.test(text)) {
      // React with a :wave: whenever `staxly` is mentioned
      await slackWeb.reactions.add('wave', {channel: channel, timestamp: ts})
    }
  }
  robot.slackAdapter.on('message.', async ({payload: message, slackWeb}) => waveWhenMentioned(message, slackWeb))
  robot.slackAdapter.on('message_changed', async ({payload: message, slackWeb}) => waveWhenMentioned({text: message.message.text, ts: message.message.ts, channel: message.channel}, slackWeb))

  //
  // When a user (not a bot) mentions a channel then add a message in that channel letting them know they were referenced
  //
  robot.slackAdapter.on('message.', async ({payload: message, slack, slackWeb}) => {
    let match

    // Ignore any messages that the bot has posted (infinite loops)
    if (robot.slackAdapter.isMe(message.user)) {
      return
    }

    while ((match = SLACK_CHANNEL_REGEXP.exec(message.text)) !== null) {
      const channelId = match[1]
      const channelName = match[2]

      // See if we have permission to post in that channel
      robot.log(`Preparing to write to ${channelId} aka ${channelName}`)

      if (channelId === message.channel) {
        // Skip posting a message when the bot is in the same channel
      } else if (robot.slackAdapter.isMemberOfChannel(channelId)) {
        // This bot is already in the channel so post there
        robot.log(`Posting to ${channelName}`)
        // Construct the permalink
        const linkTs = message.ts.split('.')
        const permalink = `https://${robot.slackAdapter.getBrain().team.domain}.slack.com/archives/${channelId}/p${linkTs[0]}${linkTs[1]}`
        await slack.sendMessage(`This channel was mentioned in <#${message.channel}> at ${permalink}`, channelId)
        try {
          await robot.slackAdapter.addReaction('link', message)
        } catch (err) {
          // ignore if we already reacted
        }
      } else if (CRITSIT_PREFIX_REGEXP.test(channelName)) {
        // Don't invite the bot to critsit channels. They are faar to common and only last for a little while
        robot.log.trace(`Ignoring invite request to critsit channel #${channelName}`)
      } else {
        const sender = robot.slackAdapter.getUserById(message.user)
        robot.log(`Asking ${sender.name} (${message.user}) to invite me to ${channelName} because I have not been invited yet`)
        await robot.slackAdapter.sendDM(message.user, `:wave: Hello. I was unable to let <#${channelId}> know that you referred to them. If you think it might be useful to let them know, please type \`/invite @staxly #${channelName}\` into the Slack text box below.\nIf not, sorry about the inconvenience. You can file an issue at https://github.com/openstax/staxly/issues/new`)
        try {
          await robot.slackAdapter.addReaction('robot_face', message)
        } catch (err) {
          // ignore if we already reacted
        }
      }
    }
  })

  // robot.on('issues.opened', async (context) => {
  //   // `context` extracts information from the event, which can be passed to
  //   // GitHub API calls. This will return:
  //   //   {owner: 'yourname', repo: 'yourrepo', number: 123, body: 'Hello World!}
  //   const params = context.issue({body: 'Hello World!'})
  //
  //   // Post a comment on the issue
  //   return context.github.issues.createComment(params)
  // })

  // If someone submits a Pull Request check if it has a reviewer
  function getSlackUserByGithubIdOrNull (githubId) {
    return robot.slackAdapter.getBrain().users.filter(user => {
      const {fields} = user.profile
      if (fields) { // Not all users have fields
        const gitHubField = fields['Xf0MQDURNX']
        if (gitHubField) {
          return githubId === gitHubField.value
        } else {
          return false
        }
      }
    })[0]
  }
  async function notifySlackUserWhenPullRequestOpened ({payload, github}) {
    const {number, html_url: htmlUrl} = payload.pull_request
    const {name, owner: {login}} = payload.repository
    const senderLogin = payload.sender.login
    const {data: {users: reviewRequests}} = await github.pullRequests.getReviewRequests({
      owner: login,
      repo: name,
      number: number
    })

    const slackUser = getSlackUserByGithubIdOrNull(senderLogin)
    if (reviewRequests.length === 0) {
      if (slackUser) {
        robot.log(`Notifying ${senderLogin} that they opened a Pull Request with no reviewers`)
        await robot.slackAdapter.sendDM(slackUser.id, `I noticed you submitted a Pull Request at ${htmlUrl} but did not include any reviewers. *Consider adding a reviewer*.\n\n You can edit my code at https://github.com/openstax/staxly or create an Issue for discussion.`)
      } else {
        robot.log(`Could not find slack user with GitHub id ${senderLogin}. Ask them to update their profile`)
      }
    }
  }
  robot.on('pull_request.opened', notifySlackUserWhenPullRequestOpened)
  robot.on('pull_request.reopened', notifySlackUserWhenPullRequestOpened)

  // For more information on building apps:
  // https://probot.github.io/docs/

  // To get your app running against GitHub, see:
  // https://probot.github.io/docs/development/
}
