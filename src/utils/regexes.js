const whitespace = '(\\s|\\r)'
const beginningOfStringOrNewline = '^(.*[\\n\\r]+)*'
const beginningOfStringOrWhitespace = '^(.*[\\s\\r]+)*'
const endOfStringOrWhitespace = '([\\s\\r]+.*)*$'

/* eslint-disable-next-line */
const githubRefGroups = '(?<owner>[a-z\-]+)\/(?<repo>[a-z\-]+)#(?<number>[0-9]+)'
/* eslint-disable-next-line */
const githubIssueLinkGroups = 'https:\/\/github.com\/(?<owner>[a-z\-]+)\/(?<repo>[a-z\-]+)\/issues\/(?<number>[0-9]+)'
/* eslint-disable-next-line */
const githubPullRequestLinkGroups = 'https:\/\/github.com\/(?<owner>[a-z\-]+)\/(?<repo>[a-z\-]+)\/pulls\/(?<number>[0-9]+)'
/* eslint-disable-next-line */
const zenhubLinkGroups = 'https:\/\/app.zenhub.com\/workspaces\/[0-9a-z\-]+\/issues\/(?<owner>[a-z\-]+)\/(?<repo>[a-z\-]+)\/(?<number>[0-9]+)'

/* eslint-disable-next-line */
const githubRef = '[a-z\-]+\/[a-z\-]+#[0-9]+'
/* eslint-disable-next-line */
const githubPullRequestLink = 'https:\/\/github.com\/[a-z\-]+\/[a-z\-]+\/pulls\/[0-9]+'
/* eslint-disable-next-line */
const zenhubLink = 'https:\/\/app.zenhub.com\/workspaces\/[0-9a-z\-]+\/issues\/[a-z\-]+\/[a-z\-]+\/[0-9]+'

module.exports = {
  whitespace,
  beginningOfStringOrNewline,
  beginningOfStringOrWhitespace,
  endOfStringOrWhitespace,
  githubRefGroups,
  githubIssueLinkGroups,
  githubPullRequestLinkGroups,
  zenhubLinkGroups,
  githubRef,
  githubPullRequestLink,
  zenhubLink
}
