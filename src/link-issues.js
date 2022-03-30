// Merge base into PR branch whenever updated
import getConnectedIssueForPR from './utils/getConnectedIssueForPR.js'
import addConnectedPRToIssue from './utils/addConnectedPRToIssue.js'
import removeConnectedPRFromIssue from './utils/removeConnectedPRFromIssue.js'

const repoWhitelist = [
  'testrepo',
  'rex-web',
  'highlights-api',
  'open-search',
  'testing-stuff'
]

const name = 'has issue link'

export default (robot) => {
  const logger = robot.log.child({ name: 'link-issues-check' })
  robot.on([
    'pull_request.opened',
    'pull_request.edited',
    'pull_request.synchronize'
  ], checkPR)

  async function checkPR (context) {
    const pullRequest = context.payload.pull_request
    /* istanbul ignore if */
    if (!repoWhitelist.includes(context.payload.repository.name)) {
      return
    }
    logger.info(`checking pr ${pullRequest.number}`)

    const check = await context.octokit.checks.create(context.repo({
      name,
      head_sha: context.payload.pull_request.head.sha,
      status: 'in_progress',
      output: { title: name, summary: 'processing' }
    }))

    const linkedIssueParams = getConnectedIssueForPR(pullRequest)
    const linkedIssue = linkedIssueParams && await context.octokit.issues.get(linkedIssueParams)
      .then(response => response.data)
      .catch(() => null)

    logger.info(`pr ${pullRequest.number} ${linkedIssue ? 'passed' : 'failed'}`)

    await context.octokit.checks.update(context.repo({
      check_run_id: check.data.id,
      status: 'completed',
      conclusion: linkedIssue ? 'success' : 'failure',
      output: linkedIssue
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

    if (context.payload.action === 'edited' && context.payload.changes.body) {
      const previousIssueParams = getConnectedIssueForPR({ ...pullRequest, body: context.payload.changes.body.from })
      const previousIssue = previousIssueParams && await context.octokit.issues.get(previousIssueParams)
        .then(response => response.data)
        .catch(/* istanbul ignore next */ () => null)

      /* istanbul ignore else */
      if (previousIssue && (!linkedIssue || previousIssue.number !== linkedIssue.number)) {
        await removeConnectedPRFromIssue(context.octokit, previousIssueParams, previousIssue, pullRequest)
      }
    }

    if (linkedIssue) {
      await addConnectedPRToIssue(context.octokit, linkedIssueParams, linkedIssue, pullRequest)
    }
  };
}
