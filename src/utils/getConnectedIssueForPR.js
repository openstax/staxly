
const beginningOfStringOrWhitespace = '^(.*(\\s|\\r){1,})?'
const endOfStringOrWhitespace = '((\\s|\\r){1,}.*)?$'

/* eslint-disable-next-line */
const githubRefGroups = '(?<owner>openstax)\/(?<repo>[a-z\-]+)#(?<issue_number>[0-9]+)'
/* eslint-disable-next-line */
const githubLinkGroups = 'https:\/\/github.com\/(?<owner>openstax)\/(?<repo>[a-z\-]+)\/issues\/(?<issue_number>[0-9]+)'
/* eslint-disable-next-line */
const zenhubLinkGroups = 'https:\/\/app.zenhub.com\/workspaces\/[0-9a-z\-]+\/issues\/(?<owner>openstax)\/(?<repo>[a-z\-]+)\/(?<issue_number>[0-9]+)'

const targetRegexes = [
  `${beginningOfStringOrWhitespace}for: ${githubRefGroups}${endOfStringOrWhitespace}`,
  `${beginningOfStringOrWhitespace}for: ${githubLinkGroups}${endOfStringOrWhitespace}`,
  `${beginningOfStringOrWhitespace}for: ${zenhubLinkGroups}${endOfStringOrWhitespace}`
]

/*
 * @argument PullRequestData
 *
 * @returns IssueParams | null
 */
module.exports = (pullRequest) => {
  const target = targetRegexes.reduce((result, regex) => result || pullRequest.body.match(regex), null)

  if (target) {
    return target.groups;
  }

  return null
}
