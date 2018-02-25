# staxly

> a GitHub App built with [probot](https://github.com/probot/probot) that runs a bot with plugins used by OpenStax

# Features

These are features coded into the bot:

### Automatically create a Card when a user reacts to a Slack message ([#18](https://github.com/openstax/staxly/pull/18))

When a user reacts to a Slack message with a `:github:` then a new Card is created (which includes a link back to the Slack chat).

The board that the card is added to depends on the Slack channel, and is configured in `/config.json`.

![autocreate-cards](https://user-images.githubusercontent.com/253202/36339066-3afefb88-138b-11e8-8194-6c74de55872d.gif)

### Add/Move Project Cards when Issues/PullRequests change ([#17](https://github.com/openstax/staxly/pull/17))

It is annoying to remember to add new Cards to a board and move the Cards when the Issue/Pull Request changes.
So the card movement is now automated. Create an Issue/PullRequest and it is added to the board. Merge/Close it and it is moved to the Done column.

The board that Card is added to is configured in the repository's `/.github/config.yml` which can inherit from another repository (to reduce copy/paste).

![project-issues](https://user-images.githubusercontent.com/253202/36498318-f09005c2-170b-11e8-90cb-771f4d13b884.gif)

### Channel link-back

When someone mentions a channel in a message, that channel gets a link back to the original message.
This is useful for notifying multiple groups, or casually asking for help.

### Other features
- [#8](https://github.com/openstax/staxly/pull/8) Reminder to add a Pull Request Reviewer
  ![image](https://user-images.githubusercontent.com/253202/35791407-c04a6d56-0a15-11e8-8790-c2d0b4a73d0b.png)
- [#16](https://github.com/openstax/staxly/pull/16) React when a user types `staxly ping` (verify the bot is up)

### Plugins

These are 3rd-party plugins that are included in this bot:

- [settings](https://github.com/probot/settings): Pull Requests for GitHub repository settings
- [autolabeler](https://github.com/probot/autolabeler): Automatically label Issues and Pull Requests based on logic in the `.github/config.yml` file
- [wip-bot](https://github.com/gr2m/wip-bot): Mark a Pull Request as unmergeable when `WIP` is in the PR title
- [probot-app-todos](https://github.com/uber-workflow/probot-app-todos): Help create Issues when code contains a "TO DO" (no spaces)
- [release-notifier](https://github.com/release-notifier/release-notifier): When a tag is created add a comment on the Pull Request denoting which release it was included in
- [request-info](https://github.com/behaviorbot/request-info): Ask for additional information when a Pull Request description is empty
- [first-pr-merge](https://github.com/behaviorbot/first-pr-merge): Welcome new contributors
- [new-issue-welcome](https://github.com/behaviorbot/new-issue-welcome): Welcome new contributors
- [new-pr-welcome](https://github.com/behaviorbot/new-pr-welcome): Welcome new contributors
- [unfurl](https://github.com/probot/unfurl): Unfurl links



# What do you think of this bot?

A bot would... (click one of the bars to vote and check out the [Issues](https://github.com/openstax/staxly/issues) to see proposals)

[![](https://api.gh-polls.com/poll/01C5RWFV2ZS0A6XTREM3Y69ETN/definitely%20help)](https://api.gh-polls.com/poll/01C5RWFV2ZS0A6XTREM3Y69ETN/definitely%20help/vote)
[![](https://api.gh-polls.com/poll/01C5RWFV2ZS0A6XTREM3Y69ETN/maybe%20help%3F)](https://api.gh-polls.com/poll/01C5RWFV2ZS0A6XTREM3Y69ETN/maybe%20help%3F/vote)
[![](https://api.gh-polls.com/poll/01C5RWFV2ZS0A6XTREM3Y69ETN/not%20help%20my%20problems)](https://api.gh-polls.com/poll/01C5RWFV2ZS0A6XTREM3Y69ETN/not%20help%20my%20problems/vote)
[![](https://api.gh-polls.com/poll/01C5RWFV2ZS0A6XTREM3Y69ETN/waste%20developer%20time)](https://api.gh-polls.com/poll/01C5RWFV2ZS0A6XTREM3Y69ETN/waste%20developer%20time/vote)

If it is doing something wrong or you would like it to do something else, check out the [Issues](https://github.com/openstax/staxly/issues).


# Contributing

To make development approachable to many types of contributors, there are several ways to get your awesome code up and running.

- **Beginner**: Just submit a Pull Request. A dev version of the bot will be automatically (re)deployed as you push code up.
  - This is a great way to get started with minimal setup. Knowledge of Git is not even needed!
- **Medium**: Ask a maintainer for dev keys to the dev bot and use Docker to start it up locally
- **Advanced**: Create your own bot and use Docker to start it up locally

Details on each option can be found in [CONTRIBUTING.md](./CONTRIBUTING.md).
