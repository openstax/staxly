# staxbot

> a GitHub App built with [probot](https://github.com/probot/probot) that runs a bot with plugins used by OpenStax

# Setup

## Install dependencies

`./script/setup` or `npm install`

## Run the bot

`./script/start` or `npm start` or for verbose logging use `./script/debug`.


See [docs/deploy.md](docs/deploy.md) if you would like to run your own instance of this app.

# GitHub Help

The robot listens to [GitHub Webhooks](https://developer.github.com/webhooks/) using `robot.on('${event_name}.${optional_event_action}', ({payload, github}) => )`.

The various values for `${event_name}` are [listed here](https://developer.github.com/webhooks/#events) and `${optional_event_action}` is the `action` field in the JSON response.

For example, `robot.on('issue.created', () => console.log('Issue created'))`.

You can use the `github` field in the callback to make additional API requests using the [@octokit/rest](https://octokit.github.io/rest.js/) library.



# Slack Help

Here is the truncated JSON for several common Slack objects

## Message

```js
{
  type: 'message',
  subtype: null, // This could optionally be 'deleted', or 'message_changed'
                 // but then the rest of the JSON fields will be different
  channel: 'D1234567',
  user: 'U234567',
  text: 'Hello World. I like the <#C123456|cooking> channel',
  ts: '1234567890.000012',
  source_team: 'T3456789',
  team: 'T3456789'
}
```

## Channel

```js
{
  id: 'C123456',
  name: 'general',
  is_channel: true,
  created: 12345678,
  is_archived: false,
  is_general: true,
  unlinked: 0,
  creator: 'U123F456P',
  name_normalized: 'general',
  is_shared: false,
  is_org_shared: false,
  has_pins: true,
  is_member: true,
  is_private: false,
  is_mpim: false,
  last_read: '12345678.000123',
  members: ['U123456', 'U234567'],
  topic: {
    value: 'Short channel topic shows up here',
    creator: '',
    last_set: 0
  },
  purpose: {
    value: 'Long channel purpose shows up here',
    creator: '',
    last_set: 0
  },
  previous_names: ['general'],
  priority: 0
}
```

## User

```js
{
  id: 'U0123456Z',
  team_id: 'T123456',
  name: 'jimsmith12',
  deleted: false,
  color: '2b6836',
  real_name: 'Jim Smith',
  tz: 'America/Houston',
  tz_label: 'Central Standard Time',
  tz_offset: -23400,
  profile: {
    title: 'My Profile Title',
    phone: '',
    skype: '',
    real_name: 'Jim Smith',
    real_name_normalized: 'Jim Smith',
    display_name: 'jimsmith12',
    display_name_normalized: 'jimsmith12',
    fields: {
      Xf0MQDURNX: {
        value: 'jimsmith12ongithub',
        alt: ''
      },
    },
    status_text: '',
    status_emoji: '',
    avatar_hash: '23947293847',
    email: 'email@nospam.com',
    first_name: 'Jim',
    last_name: 'Smith',
    image_original: 'https://avatars.slack-edge.com/some-long-sha_original.jpg',
    team: 'T1234567'
  },
  is_admin: true,
  is_owner: true,
  is_primary_owner: false,
  is_restricted: false,
  is_ultra_restricted: false,
  is_bot: false,
  updated: 151234567,
  is_app_user: false,
  presence: 'away'
}
```
