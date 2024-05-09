const { prIsReadyForAutoMerge } = require('../../src/utils/prIsReadyForAutoMerge')

const completedPipeline = `# pipeline
2B-REVIEW
  - [x] Developer approves change
`

const incompletePipeline = `# pipeline
2B-REVIEW
  - [ ] Developer approves change
`

const pipelineWithoutReview = `# pipeline
2B-ASDF
  - [ ] Developer approves change
`

describe('prIsReadyForAutoMerge', () => {
  let github
  const issue = {
    body: '',
    number: 123
  }
  const pullRequest = {
    number: 234,
    requested_reviewers: [],
    requested_teams: [],
    head: {
      ref: 'rando-change',
      repo: {
        name: 'rex-web',
        owner: {
          login: 'openstax'
        }
      }
    },
    base: {
      repo: {
        name: 'rex-web',
        owner: {
          login: 'openstax'
        }
      }
    }
  }

  beforeEach(() => {
    github = {
      issues: {
        get: jest.fn()
      },
      pulls: {
        list: jest.fn(() => Promise.resolve({ data: [] }))
      }
    }
  })

  test('uses passed in issue', async () => {
    const result = await prIsReadyForAutoMerge(
      github,
      { ...pullRequest, body: 'for: openstax/rex-web#123' },
      { ...issue, body: completedPipeline }
    )

    expect(github.issues.get).not.toHaveBeenCalled()
    expect(result).toEqual(true)
  })

  test('fetches issue if not passed', async () => {
    github.issues.get.mockReturnValue(Promise.resolve({ data: { ...issue, body: completedPipeline } }))

    const result = await prIsReadyForAutoMerge(
      github,
      { ...pullRequest, body: 'for: openstax/rex-web#123' }
    )

    expect(github.issues.get).toHaveBeenCalledTimes(1)
    expect(github.issues.get).toHaveBeenCalledWith({ repo: 'rex-web', owner: 'openstax', issue_number: '123' })
    expect(result).toEqual(true)
  })

  test('fails if pr is unlinked', async () => {
    const result = await prIsReadyForAutoMerge(
      github,
      { ...pullRequest, body: '' }
    )

    expect(github.issues.get).not.toHaveBeenCalled()
    expect(result).toEqual(false)
  })

  test('fails without pipeline', async () => {
    const result = await prIsReadyForAutoMerge(
      github,
      { ...pullRequest, body: 'for: openstax/rex-web#123' },
      issue
    )

    expect(result).toEqual(false)
  })

  test('fails if pipeline has no review', async () => {
    const result = await prIsReadyForAutoMerge(
      github,
      { ...pullRequest, body: 'for: openstax/rex-web#123' },
      { ...issue, body: pipelineWithoutReview }
    )

    expect(result).toEqual(false)
  })

  test('fails if pipeline review stage is incomplete', async () => {
    const result = await prIsReadyForAutoMerge(
      github,
      { ...pullRequest, body: 'for: openstax/rex-web#123' },
      { ...issue, body: incompletePipeline }
    )

    expect(result).toEqual(false)
  })

  test('fails if pr has sub changes', async () => {
    github.pulls.list.mockReturnValue(Promise.resolve({ data: [pullRequest] }))

    const result = await prIsReadyForAutoMerge(
      github,
      { ...pullRequest, body: 'for: openstax/rex-web#123' },
      { ...issue, body: completedPipeline }
    )

    expect(github.pulls.list).toHaveBeenCalledWith({
      repo: 'rex-web',
      owner: 'openstax',
      base: 'rando-change',
      state: 'open'
    })
    expect(result).toEqual(false)
  })
})
