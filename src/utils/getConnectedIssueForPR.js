const targetRegexes = [
  /^(.* )?link: (?<owner>openstax)\/(?<repo>[a-z\-]+)#(?<number>[0-9]+)( .*)?$/,
  /^(.* )?link: https:\/\/github.com\/(?<owner>openstax)\/(?<repo>[a-z\-]+)\/issues\/(?<number>[0-9]+)( .*)?$/,
  /^(.* )?link: https:\/\/app.zenhub.com\/workspaces\/[0-9a-z\-]+\/issues\/(?<owner>openstax)\/(?<repo>[a-z\-]+)\/(?<number>[0-9]+)( .*)?$/
];

/*
 * @argument context.issue (or equivalent)
 * @argument context.github
 *
 * @returns {owner: string, repo: string, number: string} | null
 */
module.exports = async (github, pullInfo) => {
  const pull = await github.pulls.get(pullInfo);
  const target = targetRegexes.reduce((result, regex) => result || pull.data.body.match(regex), null);

  if (target) {
    return target.groups;
  }

  return null;
};
