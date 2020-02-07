const addConnectedPRToIssue = require('../../src/utils/addConnectedPRToIssue')

describe('addConnectedPRToIssue', () => {
  let github;
  const issue = {
    body: '',
    number: 123,
    repo: {
      name: 'unified',
      owner: {
        login: 'openstax'
      }
    }
  };
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
    };
  });

  test('noops if link is already there', () => {
    const result = addConnectedPRToIssue(
      github,
      {...issue, body: 'pull requests:\n- [ ] openstax/rex-web#234'},
      pullRequest
    )
    expect(github.issues.update).not.toHaveBeenCalled();
  })

  test('appends to existing list', () => {
    const result = addConnectedPRToIssue(
      github,
      {...issue, body: 'pull requests:\n- [ ] openstax/rex-web#111'},
      pullRequest
    )
    expect(github.issues.update).toHaveBeenCalledWith(expect.objectContaining({
      body: 'pull requests:\n- [ ] openstax/rex-web#111\n- [ ] openstax/rex-web#234'
    }));
  })

  test('appends to empty list', () => {
    const result = addConnectedPRToIssue(
      github,
      {...issue, body: 'pull requests:'},
      pullRequest
    )
    expect(github.issues.update).toHaveBeenCalledWith(expect.objectContaining({
      body: 'pull requests:\n- [ ] openstax/rex-web#234'
    }));
  })

  test('appends to empty list with trailing content', () => {
    const result = addConnectedPRToIssue(
      github,
      {...issue, body: 'pull requests:\nasdf'},
      pullRequest
    )
    expect(github.issues.update).toHaveBeenCalledWith(expect.objectContaining({
      body: 'pull requests:\n- [ ] openstax/rex-web#234\nasdf'
    }));
  })

  test('adds the list if missing', () => {
    const result = addConnectedPRToIssue(
      github,
      {...issue, body: 'asdf'},
      pullRequest
    )
    expect(github.issues.update).toHaveBeenCalledWith(expect.objectContaining({
      body: 'asdf\n\npull requests:\n- [ ] openstax/rex-web#234'
    }));
  })
})
