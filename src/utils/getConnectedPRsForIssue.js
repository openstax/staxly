const {
  githubRefGroups, githubPullRequestLinkGroups, zenhubLinkGroups,
  githubRef, githubPullRequestLink, zenhubLink,
  whitespace, beginningOfStringOrNewline
} = require('./regexes');

const anyLink = `((${githubRef})|(${githubPullRequestLink})|(${zenhubLink}))`

//const prBlockRegex = `${beginningOfStringOrNewline}#* ?(\*){0,2}pull requests:?(\*+)?:?(${whitespace}*\- [ ] ${anyLink})*`
const prBlockRegex = `${beginningOfStringOrNewline}#* ?\\*{0,2}pull requests:?\\*{0,2}:?(${whitespace}*\\- \\[( |x)\\] ${anyLink})*`

const groupLinkRegexes = [
  githubRefGroups,
  githubPullRequestLinkGroups,
  zenhubLinkGroups,
];

/*
 * @argument IssueData
 *
 * @returns PullRequestParams | null
 */
module.exports = (issue) => {
  const blockMatch = issue.body.match(prBlockRegex);
  const links = blockMatch && blockMatch[0].match(new RegExp(anyLink, 'g'));

  return (links || []).map(link => {
    const result = groupLinkRegexes.reduce((result, regex) => result || link.match(regex), null)
    return result ? result.groups : null
  })
    .filter(params => !!params);

  if (blockMatch) {
    return blockMatch.groups;
  }

  return null
}
