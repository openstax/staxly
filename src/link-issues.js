// Merge base into PR branch whenever updated
const getConnectedIssueForPR = require('./utils/getConnectedIssueForPR');

const repoWhitelist = [
  'testrepo',
  'rex-web',
  'testing-stuff'
]

const name = 'issue linked';

module.exports = (robot) => {
  const logger = robot.log.child({name: 'link-issues-check'})
  robot.on([
    'pull_request.opened',
    'pull_request.edited'
  ], checkPR)

  async function checkPR(context) {
    const head_sha = context.payload.pull_request.head.sha; 
    const prInfo = {
      ...context.repo(),
      pull_number: context.payload.pull_request.number
    };
    if (!repoWhitelist.includes(prInfo.repo)) {
      return
    }

    const check = await context.github.checks.create(context.repo({
      name,
      head_sha,
      status: 'in_progress'
    }));

    const linkedIssueInfo = await getConnectedIssueForPR(context.github, prInfo);

    await context.github.checks.update(context.repo({
      check_run_id: check.data.id,
      status: 'completed',
      conclusion: linkedIssueInfo ? 'success' : 'failure', 
    }));
  };
}
