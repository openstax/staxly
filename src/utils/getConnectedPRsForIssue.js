const {anyLink, anyLinkGroups, prBlockRegex} = require('./connectedPRRegexes')

/*
 * @argument IssueData
 *
 * @returns PullRequestParams | null
 */
module.exports = (issue) => {
  const blockMatch = issue.body.match(new RegExp(prBlockRegex, 'i'))
  const links = blockMatch && blockMatch[0].match(new RegExp(anyLink, 'gi'))

  return (links || []).map(link => {
    const result = anyLinkGroups.reduce((result, regex) => result || link.match(new RegExp(regex, 'i')), null)
    return result ? result.groups : null
  })
    .filter(params => !!params)
    .map(({number, ...params}) => ({...params, pull_number: number}))
}
