const targetRegexes = [
  /*
   * these are strings to stop the linter from complaining about the named capture groups
   * which is an error that cannot be suppressed
   **/
  /* eslint-disable-next-line */
  '^(.* )?for: (?<owner>openstax)\/(?<repo>[a-z\-]+)#(?<issue_number>[0-9]+)( .*)?$',
  /* eslint-disable-next-line */
  '^(.* )?for: https:\/\/github.com\/(?<owner>openstax)\/(?<repo>[a-z\-]+)\/issues\/(?<issue_number>[0-9]+)( .*)?$',
  /* eslint-disable-next-line */
  '^(.* )?for: https:\/\/app.zenhub.com\/workspaces\/[0-9a-z\-]+\/issues\/(?<owner>openstax)\/(?<repo>[a-z\-]+)\/(?<issue_number>[0-9]+)( .*)?$'
]

/*
 * @argument context.github
 * @argument PullRequestData 
 *
 * @returns IssueData | null
 */
module.exports = async (github, pullRequest) => {
  const target = targetRegexes.reduce((result, regex) => result || pullRequest.body.match(regex), null)

  if (target) {
    return await github.issues.get(target.groups).catch(() => null);
  }

  return null
}
