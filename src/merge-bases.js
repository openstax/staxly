// Merge base into PR branch whenever updated 
module.exports = (robot) => {
  const logger = robot.log.child({name: 'merge-bases'})
  robot.on([
    'push',
  ], checkForPrs)

  function checkForPrs(context) {
    const {payload} = context

    const base = payload.ref.replace(/^refs\/heads\//, '');
    
    const {owner, repo} = context.repo()

    context.github.paginate(context.github.pulls.list({
      owner,
      repo,
      base,
      state: open,
    }), processPrs)
  }

  function processPrs({data}) {
    for (pr in data) {
      context.github.pulls.updateBranch({
        owner,
        repo,
        pull_number: pr.number,
      })
    }
  }
}
