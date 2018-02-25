## Contributing

[pr]: /compare
[style]: https://standardjs.com/
[code-of-conduct]: CODE_OF_CONDUCT.md

Hi there! We're thrilled that you'd like to contribute to this project. Your help is essential for keeping it great.

Please note that this project is released with a [Contributor Code of Conduct][code-of-conduct]. By participating in this project you agree to abide by its terms.

## Development Options

There are 3 different ways you can run a development version of the bot:

1. Start a Pull Request ([staxly-dev](https://github.com/apps/staxly-dev) will be auto-deployed for you) and push up changes until it works
1. Ask a maintainer dev keys to [staxly-dev](https://github.com/apps/staxly-dev)
1. Follow [probot's instructions for creating a new GitHub App](https://github.com/probot/probot/blob/master/docs/development.md#configure-a-github-app)

## Development with Docker

If you choose to test the bot locally, you can use Docker to quickly get the bot running on your machine.
You will need to obtain/create keys for the bot using one of the methods listed above.

### Install Docker and Docker Compose

> Follow the instructions on the [Docker website](https://docs.docker.com/compose/install/).

### Copy the .env.example file and fill in the correct values.

> Ensure you have downloaded the private key file provided by GitHub

    $ cp .env.example .env

### Run Docker Compose:

    $ docker-compose up

See [docs/deploy.md](docs/deploy.md) if you would like to run your own instance of this app.

See [How it Works](./docs/how-it-works.md) to get an overview of how the bot works.

### Development Help

See the [GitHub Help](./docs/github-help.md) section in the docs for examples and links to other documentation.

See the [Slack Help](./docs/slack-help.md) section in the docs for details.


## Submitting a pull request

1. Clone the repository
1. Configure and install the dependencies: `npm install`
1. Make sure the tests pass on your machine: `npm test`, note: these tests also apply the linter, so no need to lint separately
1. Create a new branch: `git checkout -b my-branch-name`
1. Make your change, add tests, and make sure the tests still pass
1. Push and [submit a pull request][pr]
1. Test the auto-deployed bot with one of the test repositories
1. Pat your self on the back and wait for your pull request to be reviewed and merged.

Here are a few things you can do that will increase the likelihood of your pull request being accepted:

- Follow the [style guide][style] which is using standard. Any linting errors should be shown when running `npm test`
- Write and update tests.
- Keep your change as focused as possible. If there are multiple changes you would like to make that are not dependent upon each other, consider submitting them as separate pull requests.
- Write a [good commit message](http://tbaggery.com/2008/04/19/a-note-about-git-commit-messages.html).

Work in Progress pull request are also welcome to get feedback early on, or if there is something blocking you.


## Resources

- [How to Contribute to Open Source](https://opensource.guide/how-to-contribute/)
- [Using Pull Requests](https://help.github.com/articles/about-pull-requests/)
- [GitHub Help](https://help.github.com)
