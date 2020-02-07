const addConnectedPRToIssue = require('../../src/utils/addConnectedPRToIssue')

describe('addConnectedPRToIssue', () => {
  let github
  const issueParams = {
    owner: 'openstax',
    repo: 'unified',
    issue_number: 123,
  }
  const issue = {
    body: '',
    number: 123,
  }
  const pullRequest = {
    number: 234,
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
        update: jest.fn()
      }
    }
  })

  test('noops if link is already there', () => {
    addConnectedPRToIssue(
      github,
      issueParams,
      {...issue, body: 'pull requests:\n- [ ] openstax/rex-web#234'},
      pullRequest
    )
    expect(github.issues.update).not.toHaveBeenCalled()
  })

  test('appends to existing list', () => {
    addConnectedPRToIssue(
      github,
      issueParams,
      {...issue, body: 'pull requests:\n- [ ] openstax/rex-web#111'},
      pullRequest
    )
    expect(github.issues.update).toHaveBeenCalledWith(expect.objectContaining({
      body: 'pull requests:\n- [ ] openstax/rex-web#111\n- [ ] openstax/rex-web#234'
    }))
  })

  test('appends to existing list, with caps', () => {
    addConnectedPRToIssue(
      github,
      issueParams,
      {...issue, body: 'pull requests:\n- [ ] OpenStax/rex-web#111'},
      {
        ...pullRequest,
        base: {
          repo: {
            name: 'rex-web',
            owner: {
              login: 'OpenStax'
            }
          }
        }
      }
    )
    expect(github.issues.update).toHaveBeenCalledWith(expect.objectContaining({
      body: 'pull requests:\n- [ ] OpenStax/rex-web#111\n- [ ] OpenStax/rex-web#234'
    }))
  })

  test('appends to empty list', () => {
    addConnectedPRToIssue(
      github,
      issueParams,
      {...issue, body: 'pull requests:'},
      pullRequest
    )
    expect(github.issues.update).toHaveBeenCalledWith(expect.objectContaining({
      body: 'pull requests:\n- [ ] openstax/rex-web#234'
    }))
  })

  test('appends to empty list with trailing content', () => {
    addConnectedPRToIssue(
      github,
      issueParams,
      {...issue, body: 'pull requests:\nasdf'},
      pullRequest
    )
    expect(github.issues.update).toHaveBeenCalledWith(expect.objectContaining({
      body: 'pull requests:\n- [ ] openstax/rex-web#234\nasdf'
    }))
  })

  test('adds the list if missing', () => {
    addConnectedPRToIssue(
      github,
      issueParams,
      {...issue, body: 'asdf'},
      pullRequest
    )
    expect(github.issues.update).toHaveBeenCalledWith(expect.objectContaining({
      body: 'asdf\n\npull requests:\n- [ ] openstax/rex-web#234'
    }))
  })
})
