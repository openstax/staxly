import { listPrefix } from './regexes.js'
import { anyLink, anyLinkGroups } from './connectedPRRegexes.js'
import getPRBlock from './getPRBlock.js'

/*
 * @argument context.octokit
 * @argument IssueData
 * @argument PullRequestData
 *
 * @returns Promise<void>
 */
export default (github, issueParams, issue, pullRequest) => {
  const pullNumber = pullRequest.number
  const repo = pullRequest.base.repo.name
  const owner = pullRequest.base.repo.owner.login

  const prBlock = getPRBlock(issue.body)

  /* istanbul ignore if */
  if (!prBlock) {
    return
  }

  const lines = prBlock.match(new RegExp(listPrefix + anyLink, 'gi'))

  const linesToRemove = lines.filter(line => {
    const match = anyLinkGroups.reduce((result, regex) => result || line.match(new RegExp(regex, 'i')), null)
    const params = match && match.groups
    return params && Number(params.number) === pullNumber && params.repo === repo && params.owner === owner
  })

  if (!linesToRemove.length) {
    return
  }

  const newPRBlock = linesToRemove.reduce((result, line) => result.replace(line, ''), prBlock)
  const newBody = issue.body.replace(prBlock, newPRBlock)

  return github.issues.update({
    ...issueParams,
    body: newBody
  })
}
