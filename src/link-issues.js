// Merge base into PR branch whenever updated
const getConnectedIssueForPR = require('./utils/getConnectedIssueForPR')

const repoWhitelist = [
  'testrepo',
  'rex-web',
  'testing-stuff'
]

const name = 'issue linked'

module.exports = (robot) => {
  const logger = robot.log.child({name: 'link-issues-check'})
  robot.on([
    'pull_request.opened',
    'pull_request.edited',
    'pull_request.synchronize',
  ], checkPR)

  async function checkPR (context) {
    const prInfo = {
      ...context.repo(),
      pull_number: context.payload.pull_request.number
    }
    if (!repoWhitelist.includes(prInfo.repo)) {
      return
    }
    logger.info(`checking pr ${prInfo.pull_number}`)

    const check = await context.github.checks.create(context.repo({
      name,
      head_sha: context.payload.pull_request.head.sha,
      status: 'in_progress',
      output: {title: name, summary: 'processing'}
    }))

    const linkedIssueInfo = await getConnectedIssueForPR(context.github, prInfo)

    logger.info(`pr ${prInfo.pull_number} ${linkedIssueInfo ? 'passed' : 'failed'}`)
    await context.github.checks.update(context.repo({
      check_run_id: check.data.id,
      status: 'completed',
      conclusion: linkedIssueInfo ? 'success' : 'failure',
      output: linkedIssueInfo
        ? {
          title: name,
          summary: 'good job linking to that issue! :+1:'
        }
        : {
          title: name,
          summary: 'please add a link to the issue this PR is for',
          text: 'for example `link: openstax/cool-repo#5`. `link: <github or zenhub url>` also work'
        }
    }))
  };
}
