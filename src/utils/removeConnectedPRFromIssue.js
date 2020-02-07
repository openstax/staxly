const {anyLink, listPrefix, anyLinkGroups, prBlockRegex} = require('./connectedPRRegexes');
const getConnectedPRsForIssue = require('./getConnectedPRsForIssue');

/*
 * @argument context.github
 * @argument IssueData
 * @argument PullRequestData
 *
 * @returns Promise<void>
 */
module.exports = (github, issue,  pullRequest) => {
  const pull_number = pullRequest.number;
  const repo = pullRequest.base.repo.name;
  const owner = pullRequest.base.repo.owner.login;

  const blockMatch = issue.body.match(prBlockRegex);

  if (!blockMatch) {
    return;
  }

  const lines = blockMatch[0].match(new RegExp(listPrefix + anyLink, 'g'));

  const linesToRemove = lines.filter(line => {
    const match = anyLinkGroups.reduce((result, regex) => result || line.match(regex), null)
    const params = match && match.groups;
    return params && params.number == pull_number && params.repo === repo && params.owner === owner;
  });

  if (!linesToRemove.length) {
    return;
  }

  const newPRBlock = linesToRemove.reduce((result, line) => result.replace(line, ''), blockMatch[0]);
  const newBody = issue.body.replace(blockMatch[0], newPRBlock);

  return github.issues.update({
    owner: issue.repo.owner.login,
    repo: issue.repo.name,
    issue_number: issue.number,
    body: newBody,
  });
}
