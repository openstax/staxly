# staxly

> a GitHub App built with [probot](https://github.com/probot/probot) that automates common GitHub & Slack tasks. It is used by OpenStax

# Features

These are features coded into the bot:


### Slack Channel link-back

When someone mentions a channel in a message, that channel gets a link back to the original message.
This is useful for notifying multiple groups, or casually asking for help.

### Other features
- [#8](https://github.com/openstax/staxly/pull/8) Reminder to add a Pull Request Reviewer
  ![image](https://user-images.githubusercontent.com/253202/35791407-c04a6d56-0a15-11e8-8790-c2d0b4a73d0b.png)

### Plugins

These are 3rd-party plugins that are included in this bot:

- _based on_ [changelog](https://github.com/mikz/probot-changelog): Automatically ensure that the `CHANGELOG` is updated for every Pull Request (configured in the repos `/.github/config.yml`)
- [settings](https://github.com/probot/settings): Pull Requests for GitHub repository settings
- [autolabeler](https://github.com/probot/autolabeler): Automatically label Issues and Pull Requests based on logic in the `.github/config.yml` file
- [probot-app-todos](https://github.com/uber-workflow/probot-app-todos): Help create Issues when code contains a "TO DO" (no spaces)
- [release-notifier](https://github.com/release-notifier/release-notifier): When a tag is created add a comment on the Pull Request denoting which release it was included in


# Contributing

To make development approachable to many types of contributors, there are several ways to get your awesome code up and running.
The **Beginner** option is a great way to get started with minimal setup. Knowledge of Git is not even needed!

1. **Beginner**: Start a Pull Request and push up changes until it works
  - As soon as you create the Pull Request, ([staxly-dev](https://github.com/apps/staxly-dev) will be auto-deployed for you
  - This bot listens to changes in a couple of [test repositories](https://github.com/philschatz/staxly-test) or you can install it on one of your repositories for testing
  - As you continue pushing changes, the bot will automatically be re-deployed and your Pull Request will be updated
  - See [#26](https://github.com/openstax/staxly/pull/26) for a [screncap of the whole process](https://github.com/openstax/staxly/pull/26)
1. **Intermediate**: Ask a maintainer for dev keys to [staxly-dev](https://github.com/apps/staxly-dev)
1. **Advanced**: Follow [probot's instructions for creating a new GitHub App](https://github.com/probot/probot/blob/master/docs/development.md#configure-a-github-app)


Additional details can be found in [CONTRIBUTING.md](./CONTRIBUTING.md).


# What do you think of this bot?

A bot would... (click one of the bars to vote and check out the [Issues](https://github.com/openstax/staxly/issues) to see proposals)

[![](https://api.gh-polls.com/poll/01C5RWFV2ZS0A6XTREM3Y69ETN/definitely%20help)](https://api.gh-polls.com/poll/01C5RWFV2ZS0A6XTREM3Y69ETN/definitely%20help/vote)
[![](https://api.gh-polls.com/poll/01C5RWFV2ZS0A6XTREM3Y69ETN/maybe%20help%3F)](https://api.gh-polls.com/poll/01C5RWFV2ZS0A6XTREM3Y69ETN/maybe%20help%3F/vote)
[![](https://api.gh-polls.com/poll/01C5RWFV2ZS0A6XTREM3Y69ETN/not%20help%20my%20problems)](https://api.gh-polls.com/poll/01C5RWFV2ZS0A6XTREM3Y69ETN/not%20help%20my%20problems/vote)
[![](https://api.gh-polls.com/poll/01C5RWFV2ZS0A6XTREM3Y69ETN/waste%20developer%20time)](https://api.gh-polls.com/poll/01C5RWFV2ZS0A6XTREM3Y69ETN/waste%20developer%20time/vote)

If it is doing something wrong or you would like it to do something else, check out the [Issues](https://github.com/openstax/staxly/issues).
