const prIsReadyForAutoMerge = require('./utils/prIsReadyForAutoMerge')
const getConnectedPRsForIssue = require('./utils/getConnectedPRsForIssue')

const repoWhitelist = [
  'testrepo',
  'rex-web',
  'testing-stuff'
]

module.exports = (robot) => {
  const logger = robot.log.child({name: 'auto-merge'})

  const safeBind = (events, handler) => robot.on(events, context => {
    if (!repoWhitelist.includes(context.payload.repository.name)) {
      return
    }

    return handler(context)
  })

  safeBind(['check_run.completed'], context =>
    Promise.all(context.payload.pull_requests.map(pr => {
      const pullParams = {pull_number: pr.number, ...context.repo()}
      return context.github.pulls.get(pullParams).then(response => checkPR(context, pullParams, response.data))
    }))
  )

  safeBind(['pull_request.edited', 'pull_request.labeled'], context => {
    const pullParams = {pull_number: context.payload.pull_request.number, ...context.repo()}
    return checkPR(context, pullParams, context.payload.pull_request)
  })

  safeBind(['issues.edited'], context =>
    Promise.all(getConnectedPRsForIssue(context.payload.issue).map(prParams =>
      context.github.pulls.get(prParams).then(response => checkPR(context, prParams, response.data, context.payload.issue))
    ))
  )

  async function checkPR (context, pullParams, pullRequest, issue) {
    logger.info(`checking pr ${pullRequest.number}`)

    if (pullRequest.draft || pullRequest.state !== 'open') {
      logger.info(`skipping pr ${pullRequest.number} because it is a draft or closed`)
      return
    }

    if (await prIsReadyForAutoMerge(context.github, pullRequest, issue)) {
      return context.github.pulls.merge({...pullParams, merge_method: 'squash'}).then(response => {
        if ([200, 405].includes(response.status)) {
          logger.info(`PR: ${pullRequest.number} ${response.data.message}`)
        } else {
          // TODO - not sure what type response.data is in this case, might need to json encode it
          logger.error(`status ${response.status} attempting to merge PR: ${pullRequest.number} ${response.data}`)
          return Promise.reject(response)
        }
      })
    } else {
      logger.info(`skipping pr ${pullRequest.number} because it is not ready to merge`)
    }
  }
}
