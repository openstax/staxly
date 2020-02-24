const {
  githubRefGroups, githubPullRequestLinkGroups, zenhubLinkGroups,
  githubRef, githubPullRequestLink, zenhubLink,
  whitespace, beginningOfStringOrNewline
} = require('./regexes')
const { listPrefix, anyLink } = require('./connectedPRRegexes');

const prBlockRegex = `${beginningOfStringOrNewline}(?<block>#* ?\\*{0,2}pull requests:?\\*{0,2}:?(${whitespace}*${listPrefix}${anyLink})*)`

module.exports = (body) => {
  const blockMatch = body.match(new RegExp(prBlockRegex, 'i'));
  return blockMatch && blockMatch.groups.block;
};
