const REGEXP = /^move to (\w+)/i
module.exports = (robot) => {
  robot.on([
    'issue_comment.created',
    'issue_comment.edited'
  ], moveIssue)

  async function moveIssue(context) {
    const {payload, github} = context
    const match = REGEXP.exec(payload.comment.body)
    if (match) {
      const newRepoName = match[1]
      const {owner} = context.repo()
      // TODO: Check if the repo exists. If not, create a comment on the Issue noting why the Issue could not be moved (likely repo does not exist, or bot does not have access to the repo)
      robot.log(`Attempting to move Issue to ${newRepoName}`)

      // Check if the destination repo exists
      try {
        await context.github.repos.get({owner, repo: newRepoName})
      } catch (err) {
        Raven.logErrorTODO()
        // Repo does not exist. Create a comment letting the user know that we could not move the Issue
        return await context.github.issues.createComment(context.issue({body: `I was unable to move this Issue to https://github.com/${owner}/${newRepoName}. It may not exist or I may not have permissions to that repository. Please check and try again or report it to a developer.`}))
      }


      // Create a new Issue and copy over the title, body, labels, assignees
      robot.log(`Creating new Issue at ${repoName}`)
      await context.github.issues.create({
        owner,
        repo: newRepoName,
        title: payload.issue.title,
        body: `(originally created at ${payload.issue.html_url})\n\n${payload.issue.body}`,
        assignees: payload.issue.assignees,
        labels: payload.issue.labels
      })

      // Add a comment to the old Issue that points to the new Issue
      await context.github.issues.createComment(context.issue({body: `Moved Issue to ${newIssue.html_url}`}))
      // Close the old Issue
      await context.github.issues.edit(context.issue({state: 'closed'}))
    }
  }
}
