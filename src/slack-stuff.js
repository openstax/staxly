import slackApi from './slack-api';

const SLACK_CHANNEL_REGEXP = /<#([^>|]+)\|([^>]+)>/g // Parse "foo <#C0LA54Q5C|book-tools> bar"
const CRITSIT_PREFIX_REGEXP = /^[xy]-/ // Any channel beginning with "x-" or "y-" is a critsit and don't try to invite myself to that channel

export default (robot) => {
  const logger = robot.log.child({name: 'slack-stuff'})
  // Ensure the slack-api is loaded
  slackApi(robot)

  if (!robot.slackAdapter) {
    // Slack did not initialize
    return
  }

  //
  // React with a :table_tennis_paddle_and_ball: when a new message contains "staxly ping"
  //
  async function waveWhenMentioned (message, slackWeb) {
    const {text} = message
    if (/staxly ping/.test(text)) {
      logger.info('ping detected')
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
      logger.debug(`Preparing to write to ${channelId} aka ${channelName}`)

      if (channelId === message.channel) {
        // Skip posting a message when the bot is in the same channel
      } else if (await robot.slackAdapter.isMemberOfChannel(channelId)) {
        // This bot is already in the channel so post there
        // Construct the permalink
        const permalink = robot.slackAdapter.getMessagePermalink(message.channel, message.ts)
        logger.info(`Posting to ${channelName}: ${permalink}`)
        await slack.sendMessage(`This channel was mentioned in <#${message.channel}> at ${permalink}`, channelId)
        try {
          await robot.slackAdapter.addReaction('link', message)
        } catch (err) {
          // ignore if we already reacted
        }
      } else if (CRITSIT_PREFIX_REGEXP.test(channelName)) {
        // Don't invite the bot to critsit channels. They are faar to common and only last for a little while
        logger.debug(`Ignoring invite request to critsit channel #${channelName}`)
      } else {
        const sender = robot.slackAdapter.getUserById(message.user)
        logger.info(`Asking ${sender.name} (${message.user}) to invite me to ${channelName} because I have not been invited yet`)
        await robot.slackAdapter.sendDM(message.user, `:wave: Hello. I was unable to let <#${channelId}> know that you referred to them. If you think it might be useful to let them know, please type \`/invite @${robot.slackAdapter.getBrain().self.name} #${channelName}\` into the Slack text box below.\n\nIf not, sorry about the inconvenience. You can file an issue at https://github.com/openstax/staxly/issues/new`)
        try {
          await robot.slackAdapter.addReaction('robot_face', message)
        } catch (err) {
          // ignore if we already reacted
        }
      }
    }
  })
}
