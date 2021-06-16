import { anyLink, anyLinkGroups } from './connectedPRRegexes.js'
import getPRBlock from './getPRBlock.js'

/*
 * @argument IssueData
 *
 * @returns PullRequestParams | null
 */
export default (issue) => {
  const prBlock = getPRBlock(issue.body)
  const links = prBlock && prBlock.match(new RegExp(anyLink, 'gi'))

  return (links || []).map(link => {
    const result = anyLinkGroups.reduce((result, regex) => result || link.match(new RegExp(regex, 'i')), null)
    return result ? result.groups : null
  })
    .filter(params => !!params)
    .map(({ number, ...params }) => ({ ...params, pull_number: number }))
}
