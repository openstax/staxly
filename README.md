# staxly

> a GitHub App built with [probot](https://github.com/probot/probot) that runs a bot with plugins used by OpenStax

# Features

These are features coded into the bot:

- link-back : When someone mentions a channel in a message, that channel gets a link back to the original message
  - This is useful for notifying multiple groups, or casually asking for help
- Reminder to add a Pull Request Reviewer
- React when a user types `staxly ping` (verify the bot is up)

## Plugins

These are 3rd-party plugins that are included in this bot:

- [autolabeler](https://github.com/probot/autolabeler): Automatically label Issues and Pull Requests based on logic in the `.github/config.yml` file
- [wip-bot](https://github.com/gr2m/wip-bot): Mark a Pull Request as unmergeable when `WIP` is in the PR title
- [probot-app-todos](https://github.com/uber-workflow/probot-app-todos): Help create Issues when code contains a "TODO"
- [release-notifier](https://github.com/release-notifier/release-notifier): When a tag is created add a comment on the Pull Request denoting which release it was included in
- [request-info](https://github.com/behaviorbot/request-info): Ask for additional information when a Pull Request description is empty
- [first-pr-merge](https://github.com/behaviorbot/first-pr-merge): Welcome new contributors
- [new-issue-welcome](https://github.com/behaviorbot/new-issue-welcome): Welcome new contributors
- [new-pr-welcome](https://github.com/behaviorbot/new-pr-welcome): Welcome new contributors
- [unfurl](https://github.com/probot/unfurl): Unfurl links



# What do you think of this bot?

A bot would... (click one of the bars to vote)

[![](https://api.gh-polls.com/poll/01C5RWFV2ZS0A6XTREM3Y69ETN/waste%20developer%20time)](https://api.gh-polls.com/poll/01C5RWFV2ZS0A6XTREM3Y69ETN/waste%20developer%20time/vote)
[![](https://api.gh-polls.com/poll/01C5RWFV2ZS0A6XTREM3Y69ETN/not%20help%20my%20problems)](https://api.gh-polls.com/poll/01C5RWFV2ZS0A6XTREM3Y69ETN/not%20help%20my%20problems/vote)
[![](https://api.gh-polls.com/poll/01C5RWFV2ZS0A6XTREM3Y69ETN/maybe%20help%3F)](https://api.gh-polls.com/poll/01C5RWFV2ZS0A6XTREM3Y69ETN/maybe%20help%3F/vote)
[![](https://api.gh-polls.com/poll/01C5RWFV2ZS0A6XTREM3Y69ETN/definitely%20help)](https://api.gh-polls.com/poll/01C5RWFV2ZS0A6XTREM3Y69ETN/definitely%20help/vote)
[![](https://api.gh-polls.com/poll/01C5RWFV2ZS0A6XTREM3Y69ETN/meh)](https://api.gh-polls.com/poll/01C5RWFV2ZS0A6XTREM3Y69ETN/meh/vote)

If it is doing something wrong or you would like it to do something else, check out the Issues.

# Dev Setup

## Install Docker and Docker Compose

> Follow the instructions on the [Docker website](https://docs.docker.com/compose/install/).

## Copy the .env.example file and fill in the correct values.

> Ensure you have downloaded the private key file provided by GitHub

    $ cp .env.example .env

## Run Docker Compose:

    $ docker-compose up

See [docs/deploy.md](docs/deploy.md) if you would like to run your own instance of this app.

See [How it Works](./docs/how-it-works.md) to get an overview of how the bot works.

# Development Help

See the [GitHub Help](./docs/github-help.md) section in the docs for examples and links to other documentation.

See the [Slack Help](./docs/slack-help.md) section in the docs for details.
