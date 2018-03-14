const SLACK_CHANNEL_REGEXP = /<#([^>|]+)\|([^>]+)>/g // Parse "foo <#C0LA54Q5C|book-tools> bar"
const CRITSIT_PREFIX_REGEXP = /^[xy]-/ // Any channel beginning with "x-" or "y-" is a critsit and don't try to invite myself to that channel

const STAXLY_CONFIG = require('./config.json')

module.exports = (robot) => {
  robot.events.setMaxListeners(100) // Since we use multiple plugins

  // Plugins that we use
  require('./src/slack-api')(robot)
  require('project-bot')(robot, {project: STAXLY_CONFIG.defaultProject})
  require('probot-settings')(robot)
  require('autolabeler')(robot)
  require('first-pr-merge')(robot)
  require('new-issue-welcome')(robot)
  require('new-pr-welcome')(robot)
  require('request-info')(robot)
  require('unfurl')(robot)
  // require('probot-app-todos')(robot)
  require('release-notifier')(robot)
  require('wip-bot')(robot)

  console.log('Yay, the app was loaded!')

  robot.on('push', async (context) => {
    robot.log('pushed code.')
  })

  //
  // React with a :table_tennis_paddle_and_ball: when a new message contains "staxly ping"
  //
  async function waveWhenMentioned (message, slackWeb) {
    const {text} = message
    if (/staxly ping/.test(text)) {
      robot.log('ping detected')
      robot.slackAdapter.addReaction('table_tennis_paddle_and_ball', message)
    }
  }
  robot.slackAdapter.on('message', async ({payload: message, slackWeb}) => waveWhenMentioned(message, slackWeb))
  robot.slackAdapter.on('message_changed', async ({payload: message, slackWeb}) => waveWhenMentioned({text: message.message.text, ts: message.message.ts, channel: message.channel}, slackWeb))

  //
  // When a user (not a bot) mentions a channel then add a message in that channel letting them know they were referenced
  //
  robot.slackAdapter.on('message', async ({payload: message, slack, slackWeb}) => {
    let match

    // Ignore any messages that the bot has posted (infinite loops)
    if (robot.slackAdapter.isMe(message.user)) {
      return
    }

    const channelsToMessage = []
    while ((match = SLACK_CHANNEL_REGEXP.exec(message.text)) !== null) {
      const channelId = match[1]
      const channelName = match[2]
      channelsToMessage.push({channelId, channelName})
    }
    for (const channelPair of channelsToMessage) {
      const {channelId, channelName} = channelPair

      // See if we have permission to post in that channel
      robot.log(`Preparing to write to ${channelId} aka ${channelName}`)

      if (channelId === message.channel) {
        // Skip posting a message when the bot is in the same channel
      } else if (await robot.slackAdapter.isMemberOfChannel(channelId)) {
        // This bot is already in the channel so post there
        robot.log(`Posting to ${channelName}`)
        // Construct the permalink
        const permalink = robot.slackAdapter.getMessagePermalink(message.channel, message.ts)
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
        await robot.slackAdapter.sendDM(message.user, `:wave: Hello. I was unable to let <#${channelId}> know that you referred to them. If you think it might be useful to let them know, please type \`/invite @${robot.slackAdapter.getBrain().self.name} #${channelName}\` into the Slack text box below.\n\nIf not, sorry about the inconvenience. You can file an issue at https://github.com/openstax/staxly/issues/new`)
        try {
          await robot.slackAdapter.addReaction('robot_face', message)
        } catch (err) {
          // ignore if we already reacted
        }
      }
    }
  })

  // If a slack user reacts to a message with :evergreen_tree: in a channel
  // that is associated with a Project then automatically create a Note card
  // with the contents of the Slack message and a link to the Slack message
  //
  // See https://api.slack.com/methods/conversations.history#retrieving_a_single_message
  robot.slackAdapter.on('reaction_added', async ({payload, github, slack, slackWeb}) => {
    const {reaction, item} = payload
    if ((reaction === 'evergreen_tree' || reaction === 'github') && item.type === 'message') {
      robot.log(`Noticed reaction to create a new Card`)

      // retrieve the message
      const theMessages = await slackWeb.channels.history({channel: item.channel, latest: item.ts, inclusive: true, count: 1})
      robot.log('Looked up the message from history')
      const theMessage = theMessages.messages[0]
      const {reactions, text: messageText} = theMessage
      robot.log.trace('Looked up the message. Checking if we already reacted to it')

      // Check if the message already has a check mark on it
      const linkReaction = reactions.filter((reaction) => reaction.name === 'link')[0]
      if (linkReaction) { // Should check if we were the one to add the checkmark
        return // already processed
      }

      robot.log.trace('looking up to see if this channel is configured')
      const channel = await robot.slackAdapter.getChannelById(item.channel)
      const slackCardConfig = STAXLY_CONFIG.slackChannelsToProjects.filter(({slackChannelName}) => slackChannelName === channel.name)[0]
      robot.log.trace('looking up to see if this channel is configured....')
      if (channel && slackCardConfig) {
        robot.log(`Creating Card because of reaction`)
        // Create a new Note Card on the Project
        const permalink = robot.slackAdapter.getMessagePermalink(channel.id, theMessage.ts)

        // Convert the messageText so that usernames and channelnames are not in Slack-ese (`<@U12345>`)
        const escapedText = await robot.slackAdapter.convertTextToGitHub(messageText)
        const noteBody = `${escapedText}

[Slack Link](${permalink})`

        const project = (await github.projects.getOrgProjects({org: slackCardConfig.githubProjectOrg})).data.filter(({number}) => slackCardConfig.githubProjectNumber)[0]
        const projectColumn = (await github.projects.getProjectColumns({project_id: project.id})).data[0]
        await github.projects.createProjectCard({column_id: projectColumn.id, note: noteBody})

        robot.slackAdapter.addReaction('link', {channel: channel.id, ts: theMessage.ts})
      } else {
        robot.log.trace('channel is not configured for reactions')
        const channel = await robot.slackAdapter.getChannelById(item.channel)
        await robot.slackAdapter.sendDM(theMessage.user, `:wave: I noticed you reacted to a message with a :${reaction}: indicating that I should create a Card. Unfortunately #${channel.name} is not linked to a Project so I was unable to automatically create a Card. Please file an issue at https://github.com/openstax/staxly/issues/new and we will get that fixed right up!`)
      }
    }
  })

  // // If someone submits a Pull Request check if it has a reviewer
  // function getSlackUserByGithubIdOrNull (githubId) {
  //   return robot.slackAdapter.getBrain().users.filter(user => {
  //     const {fields} = user.profile
  //     if (fields) { // Not all users have fields
  //       const gitHubField = fields['Xf0MQDURNX']
  //       if (gitHubField) {
  //         return githubId === gitHubField.value
  //       } else {
  //         return false
  //       }
  //     }
  //   })[0]
  // }
  // async function notifySlackUserWhenPullRequestOpened ({payload, github}) {
  //   const {number, html_url: htmlUrl} = payload.pull_request
  //   const {name, owner: {login}} = payload.repository
  //   const senderLogin = payload.sender.login
  //   const {data: {users: reviewRequests}} = await github.pullRequests.getReviewRequests({
  //     owner: login,
  //     repo: name,
  //     number: number
  //   })
  //
  //   const slackUser = getSlackUserByGithubIdOrNull(senderLogin)
  //   if (reviewRequests.length === 0) {
  //     if (slackUser) {
  //       robot.log(`Notifying ${senderLogin} that they opened a Pull Request with no reviewers`)
  //       await robot.slackAdapter.sendDM(slackUser.id, `I noticed you submitted a Pull Request at ${htmlUrl} but did not include any reviewers. *Consider adding a reviewer*.\n\n You can edit my code at https://github.com/openstax/staxly or create an Issue for discussion.`)
  //     } else {
  //       robot.log(`Could not find slack user with GitHub id ${senderLogin}. Ask them to update their profile`)
  //     }
  //   }
  // }
  // robot.on('pull_request.opened', notifySlackUserWhenPullRequestOpened)
  // robot.on('pull_request.reopened', notifySlackUserWhenPullRequestOpened)

  // Show the running version
  robot.router.get('/_version', (req, res) => {
    // See https://devcenter.heroku.com/changelog-items/630
    res.json({source: process.env['SOURCE_VERSION']})
  })

  // For more information on building apps:
  // https://probot.github.io/docs/

  // To get your app running against GitHub, see:
  // https://probot.github.io/docs/development/
}
