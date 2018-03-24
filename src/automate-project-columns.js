// - `new.issue` : When an Issue is created
// - `new.pullrequest` : When a Pull Request is created
// - `assigned`: When an Issue or Pull Request is assigned to a user
// - `reopened`: When an Issue or Pull Request is reopened
// - `reopened.pullrequest`:
// - `added_reviewer`: (optional username or array of usernames that need to be added)
// - `accepted`: When at least one Reviewer Accepted, and there are no Rejections on a Pull request
// - `merged`: When a Pull Request is merged
// - `closed.pullrequest`: When a Pull Request is closed
// - `added_label`: (has one argument, the string representing the name of the label)
// - `closed.issue`: When an Issue is closed

const {readFileSync} = require('fs')
const {join: pathJoin} = require('path')
const yaml = require('js-yaml')

const AUTOMATION_COMMANDS = [
  {
    webhookName: 'issues.labeled',
    ruleName: 'added_label',
    ruleMatcher: async function (context, ruleValue) {
      // labels may be defined by a label or an id (for more persistence)
      return context.payload.label.name === ruleValue || context.payload.label.id === ruleValue
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

      // Check if we need to move the Issue
      const cardsForIssue = Object.values(CARD_LOOKUP[context.payload.issue.url] || {})

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
        if (await ruleMatcher(context, ruleValue)) {
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
