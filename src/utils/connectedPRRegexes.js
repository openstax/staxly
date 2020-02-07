const {
  githubRefGroups, githubPullRequestLinkGroups, zenhubLinkGroups,
  githubRef, githubPullRequestLink, zenhubLink,
  whitespace, beginningOfStringOrNewline
} = require('./regexes');

const anyLink = `((${githubRef})|(${githubPullRequestLink})|(${zenhubLink}))`

const listPrefix = '\\n\\- \\[( |x)\\] ';
const prBlockRegex = `${beginningOfStringOrNewline}#* ?\\*{0,2}pull requests:?\\*{0,2}:?(${whitespace}*${listPrefix}${anyLink})*`

const anyLinkGroups = [
  githubRefGroups,
  githubPullRequestLinkGroups,
  zenhubLinkGroups,
];

module.exports = {
  listPrefix,
  anyLinkGroups,
  anyLink,
  prBlockRegex
}
