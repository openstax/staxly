const {prBlockRegex} = require('./connectedPRRegexes')
const getConnectedPRsForIssue = require('./getConnectedPRsForIssue')

/*
 * @argument context.github
 * @argument IssueData
 * @argument PullRequestData
 *
 * @returns Promise<void>
 */
module.exports = (github, issueParams, issue, pullRequest) => {
  const prs = getConnectedPRsForIssue(issue)

  const pullNumber = pullRequest.number
  const repo = pullRequest.base.repo.name
  const owner = pullRequest.base.repo.owner.login

  const existing = prs.find(pr => Number(pr.pull_number) === pullNumber && pr.repo === repo && pr.owner === owner)

  if (existing) {
    return
  }

  const newLink = `\n- [ ] ${owner}/${repo}#${pullNumber}`
  const blockMatch = issue.body.match(new RegExp(prBlockRegex, 'i'))
  const newBody = blockMatch
    ? issue.body.replace(blockMatch[0], blockMatch[0] + newLink)
    : issue.body + '\n\npull requests:' + newLink

  return github.issues.update({
    ...issueParams,
    body: newBody
  })
}
