const {setVersion} = require('./utils/versionsBlock')

const releaseCardRepos = {
  'testowner/testrepo': [
    'testowner/testrepo',
    'testowner/testotherrepo'
  ],
  'openstax/unified': [
    'openstax/rex-web',
    'openstax/highlights-api',
    'openstax/open-search',
    'openstax/unified-deployment'
  ],
  'TomWoodward/testing-stuff': [
    'TomWoodward/testing-stuff'
  ]
}

const updateReleaseCards = (logger, context, masterRepo, versionKey, version) => {
  const [owner, repo] = masterRepo.split('/')

  const processIssues = ({data}) => {
    return Promise.all(data
      .filter(issue => !issue.labels.map(({name}) => name).includes('locked'))
      .map(issue => {
        logger.info(`updating version "${versionKey}" in ${masterRepo}#${issue.number} to "${version}"`)
        return context.github.issues.update({
          owner,
          repo,
          issue_number: issue.number,
          body: setVersion(issue.body, versionKey, version)
        })
      })
    )
  }

  return context.github.paginate(
    context.github.issues.listForRepo.endpoint.merge({
      owner,
      repo,
      labels: 'release',
      state: 'open'
    }),
    processIssues
  )
    .then(pagePromises => Promise.all(pagePromises))
}

module.exports = (robot) => {
  const logger = robot.log.child({name: 'track-versions'})

  robot.on(['push'], (context) => {
    const {payload} = context
    const branch = payload.ref.replace(/^refs\/heads\//, '')
    const repo = payload.repository.full_name
    const versionKey = repo
    const version = payload.after

    if (branch !== 'master') {
      return
    }

    return Promise.all(
      Object.entries(releaseCardRepos)
        .filter(([, childRepos]) => childRepos.includes(repo))
        .map(([masterRepo]) => updateReleaseCards(logger, context, masterRepo, versionKey, version))
    )
  })
}
