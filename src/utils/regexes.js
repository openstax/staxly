const whitespaceCharacters = '\\s\\r'
const newlineCharacters = '\\n\\r'
const whitespace = `[${whitespaceCharacters}]`
const newline = `[${newlineCharacters}]`

const beginningOfStringOrNewline = `^([^${newlineCharacters}]+${newline}+)*[${newlineCharacters}]*`
const beginningOfStringOrWhitespace = `^([^${whitespaceCharacters}]+[${whitespaceCharacters}]+)*[${whitespaceCharacters}]*`
const endOfStringOrWhitespace = `([${whitespaceCharacters}]+[^${whitespaceCharacters}]+)*[${whitespaceCharacters}]*$`

const listPrefix = '\\n\\- \\[( |x)\\] '

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
  beginningOfStringOrNewline,
  beginningOfStringOrWhitespace,
  endOfStringOrWhitespace,
  githubIssueLinkGroups,
  githubPullRequestLink,
  githubPullRequestLinkGroups,
  githubRef,
  githubRefGroups,
  listPrefix,
  newline,
  newlineCharacters,
  whitespace,
  zenhubLink,
  zenhubLinkGroups
}
