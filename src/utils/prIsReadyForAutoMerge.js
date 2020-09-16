import {getPipelineStage} from './pipeline.js'
import getConnectedIssueForPR from './getConnectedIssueForPR.js'

const hasSubChanges = (github, pullRequest) => github.pulls.list({
  owner: pullRequest.head.repo.owner.login,
  repo: pullRequest.head.repo.name,
  base: pullRequest.head.ref,
  state: 'open'
})
  .then(response => response.data.length > 0)

const loadIssue = async (github, pullRequest) => {
  const linkedIssueParams = getConnectedIssueForPR(pullRequest)

  if (!linkedIssueParams) {
    return null
  }

  const response = await github.issues.get(linkedIssueParams)

  if (response && response.data) {
    return response.data
  }
}

export const prIsReadyForAutoMerge = async (github, pullRequest, optionalIssue) => {
  if (pullRequest.draft) {
    return false
  }

  if (pullRequest.requested_reviewers.length > 0 || pullRequest.requested_teams.length > 0) {
    return false
  }

  const issue = optionalIssue || await loadIssue(github, pullRequest)

  if (!issue) {
    return false
  }

  const review = getPipelineStage(issue.body, name => name.match(/review/i))
  const reviewComplete = review && review.complete

  if (!reviewComplete) {
    return false
  }

  if (await hasSubChanges(github, pullRequest)) {
    return false
  }

  return true
}
