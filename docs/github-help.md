# GitHub Help

The robot listens to [GitHub Webhooks](https://developer.github.com/webhooks/) using `robot.on('${event_name}.${optional_event_action}', ({payload, github}) => )`.

The various values for `${event_name}` are [listed here](https://developer.github.com/webhooks/#events) and `${optional_event_action}` is the `action` field in the JSON response.

For example, `robot.on('issue.created', ({payload}) => robot.log('Issue ' + payload.number + ' created'))`.

You can use the `github` field in the callback to make additional API requests using the [@octokit/rest](https://octokit.github.io/rest.js/) library.
