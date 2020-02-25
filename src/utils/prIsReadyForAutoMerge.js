const {getPipelineStage} = require('./pipeline');
const getConnectedIssueForPR = require('./getConnectedIssueForPR')

const hasSubChanges = (github, pullRequest) => github.pulls.list({
  owner: pullRequest.head.repo.owner.login,
  repo: pullRequest.head.repo.name,
  base: pullRequest.head.ref,
  state: 'open'
})
  .then(prs => prs.length > 0)
;


module.exports = async (github, pullRequest, optionalIssue) => {
  if (!pullRequest.labels.includes('ready to merge')) {
    return false;
  }

  const loadIssue = () => {
    const linkedIssueParams = getConnectedIssueForPR(pullRequest)
    return linkedIssueParams && github.issues.get(linkedIssueParams)
  };

  const issue = optionalIssue || await loadIssue()

  if (!issue) {
    return false;
  }

  const review = getPipelineStage(issue.body, name => name.match(/review/i));
  const reviewComplete = review && review.complete;

  if (!reviewComplete) {
    return false;
  }

  if (await hasSubChanges(github, pullRequest)) {
    return false;
  }

  return true;
}
