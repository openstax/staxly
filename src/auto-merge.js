import { prIsReadyForAutoMerge } from './utils/prIsReadyForAutoMerge.js'
import getConnectedPRsForIssue from './utils/getConnectedPRsForIssue.js'

const repoWhitelist = [
  'testrepo',
  'rex-web',
  'highlights-api',
  'open-search',
  'unified',
  'testing-stuff'
]

export default (robot) => {
  const logger = robot.log.child({ name: 'auto-merge' })

  const safeBind = (events, handler) => robot.on(events, context => {
    if (!repoWhitelist.includes(context.payload.repository.name)) {
      return
    }

    return handler(context)
  })

  safeBind(['status'], context => {
    const branches = context.payload.branches

    if (branches.length !== 1) {
      return
    }

    const [branch] = branches
    return context.octokit.pulls.list({ ...context.repo(), head: `openstax:${branch.name}` }).then(response => {
      const prs = response.data
      if (prs.length !== 1) {
        return
      }

      const [pr] = prs
      const pullParams = { pull_number: pr.number, ...context.repo() }
      return checkPR(context, pullParams, pr)
    })
  })

  safeBind(['check_run.completed'], context =>
    Promise.all(context.payload.check_run.check_suite.pull_requests.map(pr => {
      const pullParams = { pull_number: pr.number, ...context.repo() }
      return context.octokit.pulls.get(pullParams).then(response => checkPR(context, pullParams, response.data))
    }))
  )

  safeBind(['check_suite.completed'], context =>
    Promise.all(context.payload.check_suite.pull_requests.map(pr => {
      const pullParams = { pull_number: pr.number, ...context.repo() }
      return context.octokit.pulls.get(pullParams).then(response => checkPR(context, pullParams, response.data))
    }))
  )

  safeBind(['pull_request.edited', 'pull_request_review.submitted'], context => {
    const pullParams = { pull_number: context.payload.pull_request.number, ...context.repo() }
    return checkPR(context, pullParams, context.payload.pull_request)
  })

  safeBind(['issues.edited'], context =>
    Promise.all(getConnectedPRsForIssue(context.payload.issue).map(prParams =>
      context.octokit.pulls.get(prParams).then(response => checkPR(context, prParams, response.data, context.payload.issue))
    ))
  )

  async function checkPR (context, pullParams, pullRequest, issue) {
    logger.info(`checking pr ${pullRequest.number}`)

    if (pullRequest.draft || pullRequest.state !== 'open') {
      logger.info(`skipping pr ${pullRequest.number} because it is a draft or closed`)
      return
    }

    if (await prIsReadyForAutoMerge(context.octokit, pullRequest, issue)) {
      return context.octokit.pulls.merge({ ...pullParams, merge_method: 'squash' })
        .catch(error => error.status === 405
          // trying to fake the way octokit handles successful requests here
          // because there is no way to get it to handle 405s in a reasonable way
          ? Promise.resolve({ status: error.status, data: { message: error.message } })
          : Promise.reject(error)
        )
        .then(response => {
          if (![200, 405].includes(response.status)) {
            return Promise.reject(response)
          }

          logger.info(`PR: ${pullRequest.number} ${response.data.message}`)

          return Promise.resolve()
        })
    } else {
      logger.info(`skipping pr ${pullRequest.number} because it is not ready to merge`)
    }
  }
}
