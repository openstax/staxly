// Merge base into PR branch whenever updated
module.exports = (robot) => {
  const logger = robot.log.child({name: 'merge-bases'})
  robot.on([
    'push',
  ], checkForPrs)

  const processPrs = context => ({data}) => {
    const {owner, repo} = context.repo();

    return Promise.all(data.map(pr => {
      logger.info(`updating base for ${pr.number}`)
      return context.github.pulls.updateBranch({
        owner,
        repo,
        pull_number: pr.number,
      });
    }));
  }

  function checkForPrs(context) {
    const {payload} = context

    const base = payload.ref.replace(/^refs\/heads\//, '');
    const {owner, repo} = context.repo();

    logger.info(`received push event for ${base}`);

    return context.github.paginate(
      context.github.pulls.list.endpoint.merge({
        owner,
        repo,
        base,
        state: 'open',
      }),
      processPrs(context)
    )
      .then(pagePromises => Promise.all(pagePromises))
    ;
  }

}
