const removeConnectedPRFromIssue = require('../../src/utils/removeConnectedPRFromIssue')

describe('removeConnectedPRFromIssue', () => {
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

  test('noops if link is not already there', () => {
    const result = removeConnectedPRFromIssue(
      github,
      {...issue, body: 'pull requests:\n- [ ] openstax/rex-web#123'},
      pullRequest
    )
    expect(github.issues.update).not.toHaveBeenCalled();
  })

  test('removes github ref', () => {
    const result = removeConnectedPRFromIssue(
      github,
      {...issue, body: 'pull requests:\n- [ ] openstax/rex-web#234'},
      pullRequest
    )
    expect(github.issues.update).toHaveBeenCalledWith(expect.objectContaining({
      body: 'pull requests:' 
    }));
  })

  test('removes github link', () => {
    const result = removeConnectedPRFromIssue(
      github,
      {...issue, body: 'pull requests:\n- [ ] https://github.com/openstax/rex-web/pulls/234'},
      pullRequest
    )
    expect(github.issues.update).toHaveBeenCalledWith(expect.objectContaining({
      body: 'pull requests:' 
    }));
  })

  test('removes zenhub link', () => {
    const result = removeConnectedPRFromIssue(
      github,
      {...issue, body: 'pull requests:\n- [ ] https://app.zenhub.com/workspaces/openstax-unified-5b71aabe3815ff014b102258/issues/openstax/rex-web/234'},
      pullRequest
    )
    expect(github.issues.update).toHaveBeenCalledWith(expect.objectContaining({
      body: 'pull requests:' 
    }));
  })

  test('preserves rest of list', () => {
    const result = removeConnectedPRFromIssue(
      github,
      {...issue, body: 'pull requests:\n- [ ] openstax/rex-web#111\n- [ ] openstax/rex-web#234\n- [ ] openstax/rex-web#555'},
      pullRequest
    )
    expect(github.issues.update).toHaveBeenCalledWith(expect.objectContaining({
      body: 'pull requests:\n- [ ] openstax/rex-web#111\n- [ ] openstax/rex-web#555',
    }));
  })

  test('preserves surrounding content', () => {
    const result = removeConnectedPRFromIssue(
      github,
      {...issue, body: 'asdf\nasdf\nasdf\npull requests:\n- [ ] openstax/rex-web#234\nasdf\nasdf\n'},
      pullRequest
    )
    expect(github.issues.update).toHaveBeenCalledWith(expect.objectContaining({
      body: 'asdf\nasdf\nasdf\npull requests:\nasdf\nasdf\n' 
    }));
  })
})
