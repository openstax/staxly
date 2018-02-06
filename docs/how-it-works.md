# How it Works

This bot is based on [probot/probot](https://probot.github.io) but adds Slack (and maybe [trackingtime.co](https://app.trackingtime.co) :smile:).

The bot listens to [GitHub Webhooks](https://developer.github.com/webhooks) and the [Slack RTM](https://api.slack.com/rtm) and fires off events.

These events can use [octokit/rest.js](https://github.com/octokit/rest.js) to get additional information or the `robot.slackAdapter` to do things with Slack.


To link GitHub users with Slack users the bot uses the **GitHub Username** setting in your **Slack Profile**.

Bot actions can be configured using the `.github/config.yml` file in the repository (it can even [inherit settings from other repositories](https://github.com/getsentry/probot-config))
