// Merge base into PR branch whenever updated

const repoWhitelist = [
  'event-capture-api',
  'rex-web',
  'testing-stuff',
  'testrepo',
]

module.exports = (robot) => {
  const logger = robot.log.child({name: 'merge-bases'})
  robot.on([
    'push'
  ], checkForPrs)

  const processPrs = context => ({data}) => {
    const {owner, repo} = context.repo()

    return Promise.all(data.map(pr => {
      if (pr.draft) {
        logger.info(`skipping base update for ${owner}/${repo}#${pr.number} because it is a draft`)
        return Promise.resolve()
      }
      logger.info(`updating base for ${owner}/${repo}#${pr.number}`)
      return context.github.pulls.updateBranch({
        owner,
        repo,
        pull_number: pr.number
      })
        .catch(error => {
          if (error.status === 422) {
            // 422 is returned when there is a merge conflict, don't explode on these errors
            logger.info(`github response (422): ${error.message}`)
          } else {
            return Promise.reject(error)
          }
        })
    }))
  }

  function checkForPrs (context) {
    const {payload} = context

    const base = payload.ref.replace(/^refs\/heads\//, '')
    const {owner, repo} = context.repo()

    if (!repoWhitelist.includes(repo)) {
      return
    }

    logger.info(`received push event for ${base}`)

    return context.github.paginate(
      context.github.pulls.list.endpoint.merge({
        owner,
        repo,
        base,
        state: 'open'
      }),
      processPrs(context)
    )
      .then(pagePromises => Promise.all(pagePromises))
  }
}
