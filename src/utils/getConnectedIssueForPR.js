const {
  beginningOfStringOrWhitespace, endOfStringOrWhitespace,
  githubRefGroups, githubIssueLinkGroups, zenhubLinkGroups,
} = require('./regexes');

const targetRegexes = [
  `${beginningOfStringOrWhitespace}for: ${githubRefGroups}${endOfStringOrWhitespace}`,
  `${beginningOfStringOrWhitespace}for: ${githubIssueLinkGroups}${endOfStringOrWhitespace}`,
  `${beginningOfStringOrWhitespace}for: ${zenhubLinkGroups}${endOfStringOrWhitespace}`
]

/*
 * @argument PullRequestData
 *
 * @returns IssueParams | null
 */
module.exports = (pullRequest) => {
  const target = targetRegexes.reduce((result, regex) => result || pullRequest.body.match(regex), null)

  if (target) {
    return target.groups;
  }

  return null
}
