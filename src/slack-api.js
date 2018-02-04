//
// This adds a `robot.onSlack('message', ({payload, slack, slackWeb}) => )` function
// The event name is one of https://api.slack.com/rtm#events .
//
// If an event may have a subtype (ie 'message' has 'message_changed' and 'deleted')
// then you can listen also listen to the following events:
//
// - 'message.deleted' : only listen to deleted events
// - 'message.message_changed' : only listen to edited events
// - 'message.' : only listen to new messages (no subtype)
//
// TODO: Maybe we should just use the subtype since the JSON structure is different for the main type
//
// Modified from https://github.com/grrowl/probot-slack/blob/master/index.js
// since probot no longer supports robot.on('slack.message')
// because probot events assume a payload which contains the GitHub installation id

const {RtmClient, WebClient, CLIENT_EVENTS, RTM_EVENTS} = require('@slack/client')
const EventEmitter = require('promise-events')

const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN || ''

module.exports = (robot) => {
  if (!SLACK_BOT_TOKEN) {
    robot.log.error('SLACK_BOT_TOKEN missing, skipping Slack integration')
    process.exit(111)
    return
  }

  function emit(name, payload) {
    const value = {
      payload,
      slack: SlackAPI,
      slackWeb: SlackWebAPI,
    }
    robot.log.trace(`slack_event ${name}`, name === 'authenticated' ? '(too_long_to_show_in_logs)': payload)
    return events.emit(name, value).then(() => {
      if (payload && payload.subtype) { // "connected" does not have a payload
        return events.emit(`${payload.subtype}`, value)
      } else {
        return events.emit(`${name}.`, value)
      }
    })

  }

  robot.log.trace('Slack connecting...')

  // game start!
  const events = new EventEmitter()
  const SlackAPI = new RtmClient(SLACK_BOT_TOKEN)
  const SlackWebAPI = new WebClient(SLACK_BOT_TOKEN)
  let rtmBrain

  robot.slackAdapter = new class SlackAdapter {
    on(name, callback) {
      events.on(name, callback)
    }
    getBrain() {
      return rtmBrain
    }
    isMe(userId) {
      return rtmBrain.self.id === userId
    }
    myName() {
      return rtmBrain.self.name
    }
    isMemberOfChannel(channelId) {
      return this.getChannelById(channelId).is_member
    }
    getChannelById(channelId) {
      const channel = rtmBrain.channels.filter(({id}) => id === channelId)[0]
      if (!channel) {
        throw new Error(`BUG: Invalid channel id: "${channelId}"`)
      }
      return channel
    }
    getUserById(userId) {
      const user = rtmBrain.users.filter(({id}) => id === userId)[0]
      if (!user) {
        throw new Error(`BUG: Invalid user id: "${userId}"`)
      }
      return user
    }
    getMessageTimestamp(message) {
      let ts
      switch (message.subtype) {
        case 'message_changed':
          return message.message.ts
        case undefined:
          return message.ts
        case 'message_deleted':
        case 'deleted':
        default:
          throw new Error(`BUG: Cannot get timestamp for a deleted message. Well, I can but you should not be doing things based on deleted messages`)
      }
    }
    async addReaction(reactionEmoji, message) {
      const ts = this.getMessageTimestamp(message)
      return await SlackWebAPI.reactions.add(reactionEmoji, {channel: message.channel, timestamp: ts})
    }
    async removeReaction(reactionEmoji, message) {
      const ts = this.getMessageTimestamp(message)
      return await SlackWebAPI.reactions.remove(reactionEmoji, {channel: message.channel, timestamp: ts})
    }

  }

  // The client will emit an RTM.AUTHENTICATED event on successful connection, with the `rtm.start` payload
  SlackAPI.on(CLIENT_EVENTS.RTM.AUTHENTICATED, (rtmStartData) => {
    robot.log.trace('Slack successfully authenticated')
    rtmBrain = rtmStartData
    debugger
    emit('authenticated', rtmStartData)
  })

  // you need to wait for the client to fully connect before you can send messages
  SlackAPI.on(CLIENT_EVENTS.RTM.RTM_CONNECTION_OPENED, () => {
    robot.log.info('Slack connected')
    emit('connected')
  })

  // bind to all supported events <https://api.slack.com/events>
  for (const event of Object.values(RTM_EVENTS)) {
    SlackAPI.on(event, (payload) => {
      emit(event, payload)
    })
  }

  // now connect
  SlackAPI.connect('https://slack.com/api/rtm.connect');
};
