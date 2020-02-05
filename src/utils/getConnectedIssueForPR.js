const targetRegexes = [
  /*
   * these are strings to stop the linter from complaining about the named capture groups
   * which is an error that cannot be suppressed
   **/
  /* eslint-disable-next-line */
  '^(.*\\s)?for: (?<owner>openstax)\/(?<repo>[a-z\-]+)#(?<issue_number>[0-9]+)(\\s.*)?$',
  /* eslint-disable-next-line */
  '^(.*\\s)?for: https:\/\/github.com\/(?<owner>openstax)\/(?<repo>[a-z\-]+)\/issues\/(?<issue_number>[0-9]+)(\\s.*)?$',
  /* eslint-disable-next-line */
  '^(.*\\s)?for: https:\/\/app.zenhub.com\/workspaces\/[0-9a-z\-]+\/issues\/(?<owner>openstax)\/(?<repo>[a-z\-]+)\/(?<issue_number>[0-9]+)(\\s.*)?$'
]

/*
 * @argument context.github
 * @argument PullRequestData 
 *
 * @returns IssueData | null
 */
module.exports = async (logger, github, pullRequest) => {
  const target = targetRegexes.reduce((result, regex) => result || pullRequest.body.match(regex), null)

  logger.info(JSON.stringify(pullRequest.body));
  logger.info(target);

  if (target) {
    return github.issues.get(target.groups).catch(() => null);
  }

  return null
}
