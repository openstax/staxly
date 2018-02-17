const getConfig = require('probot-config')

const COLUMN_TO_DO = 1
const COLUMN_IN_PROGRESS = 2
const COLUMN_DONE = 3

const PROJECT_REPOSITORY = 'REPOSITORY'
const PROJECT_ORGANIZATION = 'ORGANIZATION'

function findColumnId (columnKey, config, columns) {
  const {index, name} = config.project.columns[columnKey]
  let column
  if (typeof index !== 'undefined') {
    column = columns[index]
  } else if (name) {
    column = columns.filter((column) => column.name === name)[0]
  }
  if (column) {
    return column.id
  } else {
    throw new Error(`Error: Unable to find project column "${columnKey}". Here is the config: ${JSON.stringify(config.project.columns)}`)
  }
}

module.exports = (robot) => {
  robot.on('issues.opened', curried('Issue', COLUMN_TO_DO))
  robot.on('issues.reopened', curried('Issue', COLUMN_TO_DO))
  robot.on('issues.closed', curried('Issue', COLUMN_DONE))

  robot.on('pull_request.opened', curried('PullRequest', COLUMN_IN_PROGRESS))
  robot.on('pull_request.merged', curried('PullRequest', COLUMN_DONE))
  robot.on('pull_request.closed', curried('PullRequest', COLUMN_DONE))
  robot.on('pull_request.reopened', curried('PullRequest', COLUMN_IN_PROGRESS))

  function curried (issueType, columnType) {
    return async (context) => {
      let id
      let url
      switch (issueType) {
        case 'Issue':
          id = context.payload.issue.id
          url = context.payload.issue.url
          break
        case 'PullRequest':
          id = context.payload.pull_request.id
          url = context.payload.pull_request.issue_url
          break
        default:
          throw new Error('BUG: invalid issueType')
      }
      putCardInColumn(issueType, columnType, context, id, url)
    }
  }

  async function putCardInColumn (issueType, columnType, context, issueId, issueUrl) {
    const {payload, github} = context
    const config = await getConfig(context, 'config.yml')
    let projectId
    let columns
    let todoColumnId
    let doingColumnId
    let doneColumnId
    if (config && config.project) {
      // get all Projects
      let projects
      switch (config.project.type) {
        case PROJECT_REPOSITORY:
          projects = (await github.projects.getRepoProjects({owner: payload.repository.owner.login, repo: payload.repository.name})).data
          break
        case PROJECT_ORGANIZATION:
          projects = (await github.projects.getOrgProjects({org: payload.repository.owner.login})).data
          break
        default:
          throw new Error(`BUG: Repository is misconfigured. Invalid project type`)
      }
      // Find the project that matches
      let project
      if (config.project.number) {
        project = projects.filter((project) => project.number === config.project.number)[0]
      }
      if (!project) {
        throw new Error(`Error: Unable to find project. Here is the config: ${JSON.stringify(config.project)}`)
      }

      // Find all of the columns
      projectId = project.id

      columns = (await github.projects.getProjectColumns({project_id: projectId})).data

      todoColumnId = findColumnId('todo', config, columns)
      doingColumnId = findColumnId('doing', config, columns)
      doneColumnId = findColumnId('done', config, columns)
    }

    let destinationColumnId
    switch (columnType) {
      case COLUMN_TO_DO:
        destinationColumnId = todoColumnId
        break
      case COLUMN_IN_PROGRESS:
        destinationColumnId = doingColumnId
        break
      case COLUMN_DONE:
        destinationColumnId = doneColumnId
        break
      default:
        throw new Error('BUG: invalid column type')
    }

    // If there is no destination to move the Issue/Pull Request to then stop.
    // This can occur when, for example, you do not want new Issues to
    // automatically show up in the Todo column
    if (!destinationColumnId) {
      return
    }

    // add a new card (if it does not exist)
    let allCards = []
    for (const column of columns) {
      const data = await github.projects.getProjectCards({column_id: column.id})
      allCards = allCards.concat(data.data)
    }

    let card = allCards.filter((card) => card.content_url === issueUrl)[0] // may be null
    if (card) {
      // Move the card to the todoColumn
      await github.projects.moveProjectCard({column_id: destinationColumnId, id: card.id, position: 'top'})
    } else {
      card = await github.projects.createProjectCard({column_id: destinationColumnId, content_id: issueId, content_type: issueType})
    }
  }
}
