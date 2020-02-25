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

    return handler(context);
  });

  safeBind(['check_run.completed'], context =>
    Promise.all(context.payload.pull_requests.map(pr => {
      const pullParams = {pull_number: pr.number, owner: context.repository.owner.login, repo: context.repository.name}
      return context.github.pulls.get(pullParams).then(pullRequest => checkPR(context, pullParams, pullRequest));
    }));
  )

  safeBind(['pull_request.edited'], context => {
    const pullParams = {pull_number: context.payload.pull_request.number, owner: context.repository.owner.login, repo: context.repository.name}
    return checkPR(context, pullParams, context.payload.pull_request);
  })

  safeBind(['issue.edited'], context =>
    Promise.all(getConnectedPRsForIssue(context.payload.issue).map(prParams =>
      context.github.pulls.get(prParams).then(pr => checkPR(context, prParams, pr, context.payload.issue))
    ));
  )

  async function checkPR(context, pullParams, pullRequest, issue) {
    logger.info(`checking pr ${pullRequest.number}`)

    if (pullRequest.draft || pullRequest.state !== 'open') {
      return;
    }

    if (prIsReadyForAutoMerge(context.github, pullRequest, issue)) {
      return context.github.pulls.merge({...pullParams, merge_method: 'squash'}).then(response => {
        if ([200, 405].includes(response.status)) {
          return response.json().then(json => {
            logger.info(`PR: ${pullRequest.number} ${json.message}`)
          });
        }

        return response.text().then(text => {
          logger.error(`status ${response.status} attempting to merge PR: ${pullRequest.number} ${text}`)
          return Promise.reject(text);
        });
      });
    }
  }
}
