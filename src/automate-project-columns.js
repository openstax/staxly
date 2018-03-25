// - [x] `new.issue` : When an Issue is created
// - [x] `new.pullrequest` : When a Pull Request is created
// - [x] `assigned_to.issue`: When an Issue is assigned to a specific user
// - [x] `assigned.issue`: When an Issue is assigned to a user (but was not before)
// - [x] `unassigned.issue`: When an Issue is no longer assigned to a user
// - [x] `assigned.pullrequest`: When a Pull Request is assigned to a user (but was not before)
// - [x] `unassigned.pullrequest`: When a Pull Request is no longer assigned to a user
// - [x] `reopened.issue`: When an Issue is reopened
// - [x] `reopened.pullrequest`: When a Pull Request is reopened
// - [x] `added_reviewer`: (optional username or array of usernames that need to be added)
// - [x] `accepted`: When at least one Reviewer Accepted, and there are no Rejections on a Pull request
// - [x] `merged`: When a Pull Request is merged
// - [x] `closed.pullrequest`: When a Pull Request is closed
// - [x] `added_label`: (has one argument, the string representing the name of the label)
// - [x] `removed_label`: (has one argument, the string representing the name of the label)
// - [x] `closed.issue`: When an Issue is closed
// - [x] `edited.issue`
// - [x] `milestoned.issue`
// - [x] `demilestoned.issue`

const {readFileSync} = require('fs')
const {join: pathJoin} = require('path')
const yaml = require('js-yaml')

function ALWAYS_TRUE () { return true }

const AUTOMATION_COMMANDS = [
  { ruleName: 'edited.issue', webhookName: 'issues.edited', ruleMatcher: ALWAYS_TRUE },
  { ruleName: 'demilestoned.issue', webhookName: 'issues.demilestoned', ruleMatcher: ALWAYS_TRUE },
  { ruleName: 'milestoned.issue', webhookName: 'issues.milestoned', ruleMatcher: ALWAYS_TRUE },
  { ruleName: 'new.issue', webhookName: 'issues.opened', ruleMatcher: ALWAYS_TRUE },
  { ruleName: 'new.pullrequest', webhookName: 'pull_request.opened', ruleMatcher: ALWAYS_TRUE },
  { ruleName: 'reopened.pullrequest', webhookName: 'pull_request.reopened', ruleMatcher: ALWAYS_TRUE },
  { ruleName: 'reopened.issue', webhookName: 'issues.reopened', ruleMatcher: ALWAYS_TRUE },
  { ruleName: 'closed.issue', webhookName: 'issues.closed', ruleMatcher: ALWAYS_TRUE },
  { ruleName: 'added_reviewer', webhookName: 'pull_request.review_requested', ruleMatcher: ALWAYS_TRUE }, // See https://developer.github.com/v3/activity/events/types/#pullrequestevent to get the reviewer
  {
    ruleName: 'merged',
    webhookName: 'pull_request.closed',
    ruleMatcher: async function (robot, context, ruleValue) {
      // see https://developer.github.com/v3/activity/events/types/#pullrequestevent
      return !!context.payload.pull_request.merged
    }
  },
  {
    ruleName: 'closed.pullrequest',
    webhookName: 'pull_request.closed',
    ruleMatcher: async function (robot, context, ruleValue) {
      // see https://developer.github.com/v3/activity/events/types/#pullrequestevent
      return !context.payload.pull_request.merged
    }
  },
  {
    ruleName: 'assigned_to.issue',
    webhookName: 'issues.assigned',
    ruleMatcher: async function (robot, context, ruleValue) {
      if (ruleValue !== true) {
        return context.payload.assignee.login === ruleValue
      } else {
        robot.log.error(`assigned_to.issue requires a username but it is missing`)
      }
    }
  },
  {
    ruleName: 'assigned.issue',
    webhookName: 'issues.assigned',
    ruleMatcher: async function (robot, context, ruleValue) {
      return context.payload.issue.assignees.length === 1
    }
  },
  {
    ruleName: 'unassigned.issue',
    webhookName: 'issues.unassigned',
    ruleMatcher: async function (robot, context, ruleValue) {
      return context.payload.issue.assignees.length === 0
    }
  },
  {
    ruleName: 'assigned.pullrequest',
    webhookName: 'pull_request.assigned',
    ruleMatcher: async function (robot, context, ruleValue) {
      return context.payload.pull_request.assignees.length === 1
    }
  },
  {
    ruleName: 'unassigned.pullrequest',
    webhookName: 'pull_request.unassigned',
    ruleMatcher: async function (robot, context, ruleValue) {
      return context.payload.pull_request.assignees.length === 0
    }
  },
  {
    ruleName: 'added_label',
    webhookName: 'issues.labeled',
    ruleMatcher: async function (robot, context, ruleValue) {
      // labels may be defined by a label or an id (for more persistence)
      return context.payload.label.name === ruleValue || context.payload.label.id === ruleValue
    }
  },
  {
    ruleName: 'removed_label',
    webhookName: 'issues.unlabeled',
    ruleMatcher: async function (robot, context, ruleValue) {
      return context.payload.label.name === ruleValue || context.payload.label.id === ruleValue
    }
  },
  {
    ruleName: 'accepted',
    webhookName: 'pull_request_review.submitted',
    ruleMatcher: async function (robot, context, ruleValue) {
      // See https://developer.github.com/v3/activity/events/types/#pullrequestreviewevent
      // Check if there are any Pending or Rejected reviews and ensure there is at least one Accepted one
      const {data: reviews} = await context.github.pullRequests.getReviews(context.issue())
      // Check that there is at least one Accepted
      const hasAccepted = reviews.filter((review) => review.state === 'APPROVED').length >= 1
      const hasRejections = reviews.filter((review) => review.state === 'REQUEST_CHANGES').length >= 1
      const hasPending = reviews.filter((review) => review.state === 'PENDING').length >= 1
      if (hasAccepted && !hasRejections && !hasPending) {
        return true
      } else {
        return false
      }
    }
  }
]

module.exports = (robot) => {
  const {automate_project_columns: automateProjectColumnsConfig} = yaml.safeLoad(readFileSync(pathJoin(__dirname, '..', 'config.yml')))

  // Load all the Cards in memory because there is no way to lookup which projects an Issue is in
  const CARD_LOOKUP = {} // Key is "{issue_url}" and value is [{projectId, cardId}]
  let ORG_PROJECTS = {} // Only load this once for each org
  let REPO_PROJECTS = {} // Only load this once for each repo

  async function populateCache (context) {
    // Loop through all the projects in the config and add them to the cache
    for (const projectConfig of automateProjectColumnsConfig) {
      let projectId
      if (projectConfig.id) {
        projectId = projectConfig.id
      } else if (projectConfig.org && projectConfig.number) {
        if (!ORG_PROJECTS[projectConfig.org]) {
          const {data: projects} = await context.github.projects.getOrgProjects({org: projectConfig.org, state: 'open'})
          ORG_PROJECTS[projectConfig.org] = projects
        }
        // Look up the Project in the org
        const project = ORG_PROJECTS[projectConfig.org].filter((project) => project.number === projectConfig.number)[0]
        projectId = project.id
      } else if (projectConfig.repo_owner && projectConfig.repo_name && projectConfig.number) {
        if (!REPO_PROJECTS[`${projectConfig.repo_owner}/${projectConfig.repo_name}`]) {
          const {data: projects} = await context.github.projects.getRepoProjects({owner: projectConfig.repo_owner, repo: projectConfig.repo_name, state: 'open'})
          REPO_PROJECTS[`${projectConfig.repo_owner}/${projectConfig.repo_name}`] = projects
        }
        // Look up the Project
        const project = REPO_PROJECTS[`${projectConfig.repo_owner}/${projectConfig.repo_name}`].filter((project) => project.number === projectConfig.number)[0]
        projectId = project.id
      }

      if (projectId) {
        if (!projectConfig.id) {
          robot.log.warn(`Set this to be "id: ${projectId}" for less fragility. JSON=${JSON.stringify(projectConfig)}`)
        }
        const {data: projectColumns} = await context.github.projects.getProjectColumns({project_id: projectId})
        for (const projectColumn of projectColumns) {
          const {data: projectCards} = await context.github.projects.getProjectCards({column_id: projectColumn.id})

          for (const projectCard of projectCards) {
            // Issues can belong to multiple cards
            if (projectCard.content_url) {
              CARD_LOOKUP[projectCard.content_url] = CARD_LOOKUP[projectCard.content_url] || {}
              CARD_LOOKUP[projectCard.content_url][projectCard.id] = {projectId: projectId, cardId: projectCard.id, projectConfig: projectConfig}
            }
          }
        }
      } else {
        robot.log.error(`Could not find project. JSON=${JSON.stringify(projectConfig)}`)
      }
    } // Finished populating the CARD_LOOKUP cache
  }

  // Register all of the automation commands
  AUTOMATION_COMMANDS.forEach(({webhookName, ruleName, ruleMatcher}) => {
    robot.on(webhookName, async function (context) {
      await populateCache(context)

      // Check if we need to move the Issue (or Pull request)
      const issueUrl = context.payload.issue ? context.payload.issue.url : context.payload.pull_request.issue_url
      const cardsForIssue = Object.values(CARD_LOOKUP[issueUrl] || {})

      // At this point we need the cards and columns that need to be moved.
      const matchedColumnInfos = cardsForIssue.map(({projectId, cardId, projectConfig}) => {
        // Check if there are any columns that match the ruleName.
        // If so, return the following:
        // - ruleArgs (most of the time it is just `true`)
        // - columnInfo
        // - cardId
        // - projectId

        let columnInfo = null
        let ruleValue = null
        for (const column of projectConfig.columns) {
          if (column.rules[ruleName]) {
            if (columnInfo) {
              robot.log.error(`Duplicate rule named "${ruleName}" within project config ${JSON.stringify(projectConfig)}`)
            } else {
              columnInfo = column
              ruleValue = column.rules[ruleName]
            }
          }
        }

        if (columnInfo) {
          return {
            columnInfo,
            cardId,
            projectId,
            ruleValue
          }
        } else {
          return null
        }
      }).filter((info) => !!info) // remove all the nulls (ruleName not found in this projectConfig)

      matchedColumnInfos.forEach(async ({columnInfo, cardId, projectId, ruleValue}) => {
        if (await ruleMatcher(robot, context, ruleValue)) {
          // Move the Card
          const {data: columns} = await context.github.projects.getProjectColumns({project_id: projectId})

          // Find the correct column
          let columnId
          if (columnInfo.id) {
            columnId = columnInfo.id
          } else if (columnInfo.index) {
            columnId = columns[columnInfo.index].id
            robot.log.warn(`Consider identifying the column by "id: ${columnId}" rather than by index in JSON=${JSON.stringify(columnInfo)}`)
          }

          if (!columnId) {
            robot.log.error(`Could not find column for JSON=${JSON.stringify(columnInfo)}`)
            return
          }
          await context.github.projects.moveProjectCard({id: cardId, column_id: columnId, position: 'top'})
        }
      })
    })
  })
}
