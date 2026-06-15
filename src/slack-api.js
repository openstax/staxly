//
// This adds a `robot.slackAdapter.on('message', ({payload, slack, slackWeb}) => )` function
// The event name is one of https://api.slack.com/events .
//
// If an event may have a subtype (ie 'message' has 'message_changed' and 'deleted')
// then you can listen also listen to the following events:
//
// - 'message::deleted' : only listen to deleted events
// - 'message::message_changed' : only listen to edited events
// - 'message' : only listen to new messages (no subtype)
//
// Modified from https://github.com/grrowl/probot-slack/blob/master/index.js
// since probot no longer supports robot.on('slack.message')
// because probot events assume a payload which contains the GitHub installation id

import { App } from '@slack/bolt'

const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN
const SLACK_APP_TOKEN = process.env.SLACK_APP_TOKEN
const SLACK_GITHUB_INSTALL_ID = process.env.SLACK_GITHUB_INSTALL_ID

/* istanbul ignore next */
export default (robot) => {
  const logger = robot.log.child({ name: 'slack' })
  if (!SLACK_BOT_TOKEN) {
    logger.warn('SLACK_BOT_TOKEN missing, skipping Slack integration')
    return
  }
  if (!SLACK_APP_TOKEN) {
    logger.warn('SLACK_APP_TOKEN missing, skipping Slack integration (required for Socket Mode)')
    return
  }
  if (!SLACK_GITHUB_INSTALL_ID) {
    logger.warn('SLACK_GITHUB_INSTALL_ID missing. This is needed to know which authentication to use when creating GitHub Issues/Cards. It can be found in the probot trace output for /installations when LOG_LEVEL=trace')
  }

  let authenticatedGitHubClient
  let authInfo

  const app = new App({
    token: SLACK_BOT_TOKEN,
    appToken: SLACK_APP_TOKEN,
    socketMode: true
  })

  const eventListeners = {}

  // slack.sendMessage(text, channel) shim for callers expecting RTM-style API
  const slackSendShim = {
    sendMessage: (text, channel) => app.client.chat.postMessage({ text, channel })
  }

  robot.slackAdapter = new class SlackAdapter {
    on (name, callback) {
      if (!eventListeners[name]) {
        eventListeners[name] = []
      }
      eventListeners[name].push(callback)
    }

    async emit (name, payload) {
      const listeners = eventListeners[name] || []
      if (!listeners.length) return
      if (!authenticatedGitHubClient && SLACK_GITHUB_INSTALL_ID) {
        authenticatedGitHubClient = await robot.auth(SLACK_GITHUB_INSTALL_ID)
      }
      const value = {
        payload,
        github: authenticatedGitHubClient || null,
        slack: slackSendShim,
        slackWeb: app.client
      }
      logger.trace(`slack_event ${name}`, payload)
      for (const listener of listeners) {
        await listener(value)
      }
    }

    getBrain () {
      if (!authInfo) return null
      const domain = authInfo.url.replace(/^https?:\/\//, '').replace(/\.slack\.com\/?$/, '')
      return {
        self: { id: authInfo.user_id, name: authInfo.user },
        team: { domain }
      }
    }

    isMe (userId) {
      return authInfo && authInfo.user_id === userId
    }

    myName () {
      return authInfo && authInfo.user
    }

    async isMemberOfChannel (channelId) {
      const channel = await this.getChannelById(channelId)
      return channel.is_member
    }

    async getChannelById (channelId) {
      const data = await app.client.conversations.info({ channel: channelId })
      return data.channel
    }

    async getUserById (userId) {
      const data = await app.client.users.info({ user: userId })
      return data.user
    }

    async getGithubUserBySlackUserIdOrNull (slackUserId) {
      const slackUser = await this.getUserById(slackUserId)
      const { fields } = slackUser.profile
      if (fields) { // Not all users have fields
        const githubField = fields.Xf0MQDURNX
        if (githubField) {
          return githubField.value
        }
      }
    }

    getMessageTimestamp (message) {
      switch (message.subtype) {
        case 'message_changed':
          return message.message.ts
        case undefined:
          return message.ts
        case 'message_deleted':
        case 'deleted':
        default:
          throw new Error('BUG: Cannot get timestamp for a deleted message. Well, I can but you should not be doing things based on deleted messages')
      }
    }

    getMessagePermalink (channelId, messageTs) {
      const brain = this.getBrain()
      if (!brain) return null
      return `https://${brain.team.domain}.slack.com/archives/${channelId}/p${messageTs.replace('.', '')}`
    }

    async convertTextToGitHub (text) {
      const USER_REGEXP = /<@([^>]*)/
      let match
      while ((match = USER_REGEXP.exec(text)) != null) {
        const slackUserId = match[1]
        const githubUserId = await this.getGithubUserBySlackUserIdOrNull(slackUserId)
        if (githubUserId) {
          text = text.replace(`<@${slackUserId}>`, `@${githubUserId}`)
        } else {
          text = text.replace(`<@${slackUserId}>`, `${this.getUserById(slackUserId).name}`)
        }
      }
      return text
    }

    async addReaction (reactionEmoji, message) {
      const ts = this.getMessageTimestamp(message)
      try {
        return await app.client.reactions.add({ name: reactionEmoji, channel: message.channel, timestamp: ts })
      } catch (err) {
        // already reacted
        logger.trace(err, 'Slack already reacted to the message')
      }
    }

    async removeReaction (reactionEmoji, message) {
      const ts = this.getMessageTimestamp(message)
      return app.client.reactions.remove({ name: reactionEmoji, channel: message.channel, timestamp: ts })
    }

    async sendDM (userId, messageText) {
      const { channel: { id: dmChannelId } } = await app.client.conversations.open({ users: userId })
      await app.client.chat.postMessage({ text: messageText, channel: dmChannelId })
    }
  }()

  logger.trace('Slack connecting...')

  app.event('message', async ({ event }) => {
    const { subtype } = event
    if (!subtype) {
      await robot.slackAdapter.emit('message', event)
    } else if (subtype === 'message_changed') {
      await robot.slackAdapter.emit('message_changed', event)
      await robot.slackAdapter.emit('message::message_changed', event)
    } else if (subtype === 'message_deleted') {
      await robot.slackAdapter.emit('message::deleted', event)
    }
  })

  app.error(async (error) => {
    logger.error('slack error', error)
  })

  app.start().then(async () => {
    authInfo = await app.client.auth.test()
    logger.info('Authenticated')
    logger.debug(authInfo)
    logger.trace('Slack connected')
  }).catch((err) => {
    logger.error('Failed to start Slack', err)
  })
}
