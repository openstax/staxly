const {anyLink, listPrefix, anyLinkGroups, prBlockRegex} = require('./connectedPRRegexes')

/*
 * @argument context.github
 * @argument IssueData
 * @argument PullRequestData
 *
 * @returns Promise<void>
 */
module.exports = (github, issueParams, issue, pullRequest) => {
  const pullNumber = pullRequest.number
  const repo = pullRequest.base.repo.name
  const owner = pullRequest.base.repo.owner.login

  const blockMatch = issue.body.match(new RegExp(prBlockRegex, 'i'))

  if (!blockMatch) {
    return
  }

  const lines = blockMatch[0].match(new RegExp(listPrefix + anyLink, 'gi'))

  const linesToRemove = lines.filter(line => {
    const match = anyLinkGroups.reduce((result, regex) => result || line.match(new RegExp(regex, 'i')), null)
    const params = match && match.groups
    return params && Number(params.number) === pullNumber && params.repo === repo && params.owner === owner
  })

  if (!linesToRemove.length) {
    return
  }

  const newPRBlock = linesToRemove.reduce((result, line) => result.replace(line, ''), blockMatch[0])
  const newBody = issue.body.replace(blockMatch[0], newPRBlock)

  return github.issues.update({
    ...issueParams,
    body: newBody
  })
}
