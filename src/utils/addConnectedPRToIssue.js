import getConnectedPRsForIssue from './getConnectedPRsForIssue.js'
import getPRBlock from './getPRBlock.js'

/*
 * @argument context.github
 * @argument IssueData
 * @argument PullRequestData
 *
 * @returns Promise<void>
 */
export default (github, issueParams, issue, pullRequest) => {
  const prs = getConnectedPRsForIssue(issue)

  const pullNumber = pullRequest.number
  const repo = pullRequest.base.repo.name
  const owner = pullRequest.base.repo.owner.login

  const existing = prs.find(pr => Number(pr.pull_number) === pullNumber && pr.repo === repo && pr.owner === owner)

  if (existing) {
    return
  }

  const newLink = `\n- [ ] ${owner}/${repo}#${pullNumber}`
  const prBlock = getPRBlock(issue.body)

  const newBody = prBlock
    ? issue.body.replace(prBlock, prBlock + newLink)
    : issue.body + '\n\npull requests:' + newLink

  return github.issues.update({
    ...issueParams,
    body: newBody
  })
}
