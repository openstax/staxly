const {getPipelineStage} = require('./pipeline')
const getConnectedIssueForPR = require('./getConnectedIssueForPR')

const hasSubChanges = (github, pullRequest) => github.pulls.list({
  owner: pullRequest.head.repo.owner.login,
  repo: pullRequest.head.repo.name,
  base: pullRequest.head.ref,
  state: 'open'
})
  .then(prs => prs.length > 0)

const readyToMergeLabel = 'ready to merge'

const prIsReadyForAutoMerge = async (github, pullRequest, optionalIssue) => {
  if (!pullRequest.labels.map(({name}) => name).includes(readyToMergeLabel)) {
    return false
  }

  const loadIssue = async () => {
    const linkedIssueParams = getConnectedIssueForPR(pullRequest)

    if (!linkedIssueParams) {
      return null
    }

    const response = await github.issues.get(linkedIssueParams)

    if (response && response.data) {
      return response.data
    }
  }

  const issue = optionalIssue || await loadIssue()

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

module.exports = {
  prIsReadyForAutoMerge,
  readyToMergeLabel
}
