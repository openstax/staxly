// Merge base into PR branch whenever updated
const getConnectedIssueForPR = require('./utils/getConnectedIssueForPR')

const repoWhitelist = [
  'testrepo',
  'rex-web',
  'testing-stuff'
]

const name = 'has issue link'

module.exports = (robot) => {
  const logger = robot.log.child({name: 'link-issues-check'})
  robot.on([
    'pull_request.opened',
    'pull_request.edited',
    'pull_request.synchronize',
  ], checkPR)

  async function checkPR (context) {
    const pullRequest = context.payload.pull_request;
    if (!repoWhitelist.includes(context.payload.repository.name)) {
      return
    }
    logger.info(`checking pr ${pullRequest.number}`)

    const check = await context.github.checks.create(context.repo({
      name,
      head_sha: context.payload.pull_request.head.sha,
      status: 'in_progress',
      output: {title: name, summary: 'processing'}
    }))

    const linkedIssueInfo = await getConnectedIssueForPR(context.github, pullRequest)

    logger.info(`pr ${pullRequest.number} ${linkedIssueInfo ? 'passed' : 'failed'}`)

    await context.github.checks.update(context.repo({
      check_run_id: check.data.id,
      status: 'completed',
      conclusion: linkedIssueInfo ? 'success' : 'failure',
      output: linkedIssueInfo
        ? {
          title: 'all is as it should be',
          summary: 'good job linking to that issue! :+1:'
        }
        : {
          title: 'please add an issue reference',
          summary: 'please add a link to the issue this PR is for to the PR description',
          text: 'for example `for: openstax/cool-repo#5`. `for: <github or zenhub url>` also work'
        }
    }))
  };
}
