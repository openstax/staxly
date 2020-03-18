const {
  githubRefGroups, githubPullRequestLinkGroups, zenhubLinkGroups,
  githubRef, githubPullRequestLink, zenhubLink
} = require('./regexes')

const anyLink = `((${githubRef})|(${githubPullRequestLink})|(${zenhubLink}))`

const anyLinkGroups = [
  githubRefGroups,
  githubPullRequestLinkGroups,
  zenhubLinkGroups
]

module.exports = {
  anyLinkGroups,
  anyLink
}
