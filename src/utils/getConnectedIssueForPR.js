import {
  beginningOfStringOrWhitespace, endOfStringOrWhitespace,
  githubRefGroups, githubIssueLinkGroups, zenhubLinkGroups
} from './regexes'

const targetRegexes = [
  `${beginningOfStringOrWhitespace}for: ${githubRefGroups}${endOfStringOrWhitespace}`,
  `${beginningOfStringOrWhitespace}for: ${githubIssueLinkGroups}${endOfStringOrWhitespace}`,
  `${beginningOfStringOrWhitespace}for: ${zenhubLinkGroups}${endOfStringOrWhitespace}`
]

/*
 * @argument PullRequestData
 *
 * @returns IssueParams | null
 */
export default (pullRequest) => {
  const target = targetRegexes.reduce((result, regex) => result || pullRequest.body.match(new RegExp(regex, 'i')), null)

  if (target && target.groups) {
    const {number, ...params} = target.groups
    return {...params, issue_number: number}
  }

  return null
}
