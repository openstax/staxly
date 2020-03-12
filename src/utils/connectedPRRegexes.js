const {
  githubRefGroups, githubPullRequestLinkGroups, zenhubLinkGroups,
  githubRef, githubPullRequestLink, zenhubLink
} = require('./regexes')

const anyLink = `((${githubRef})|(${githubPullRequestLink})|(${zenhubLink}))`

const listPrefix = '\\n\\- \\[( |x)\\] '

const anyLinkGroups = [
  githubRefGroups,
  githubPullRequestLinkGroups,
  zenhubLinkGroups
]

module.exports = {
  listPrefix,
  anyLinkGroups,
  anyLink
}
