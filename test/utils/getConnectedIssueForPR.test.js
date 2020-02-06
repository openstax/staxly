const getConnectedIssueForPR = require('../../src/utils/getConnectedIssueForPR')

describe('getConnectedIssueForPR', () => {
  let github

  beforeEach(() => {
    github = {
      issues: {
        get: jest.fn(() => Promise.resolve())
      }
    }
  })

  test('resolves github ref', async () => {
    await getConnectedIssueForPR(github, {body: 'for: openstax/rex-web#123'})
    expect(github.issues.get).toHaveBeenCalledWith({repo: 'rex-web', owner: 'openstax', issue_number: '123'})
  })

  test('resolves github link', async () => {
    await getConnectedIssueForPR(github, {body: 'for: https://github.com/openstax/unified/issues/123'})
    expect(github.issues.get).toHaveBeenCalledWith({repo: 'unified', owner: 'openstax', issue_number: '123'})
  })

  test('resolves zenhub link', async () => {
    await getConnectedIssueForPR(github, {body: 'for: https://app.zenhub.com/workspaces/openstax-unified-5b71aabe3815ff014b102258/issues/openstax/unified/123'})
    expect(github.issues.get).toHaveBeenCalledWith({repo: 'unified', owner: 'openstax', issue_number: '123'})
  })

  test('resolves with stuff around', async () => {
    await getConnectedIssueForPR(github, {body: 'asdf for: openstax/rex-web#123 asdf'})
    expect(github.issues.get).toHaveBeenCalledWith({repo: 'rex-web', owner: 'openstax', issue_number: '123'})
  })

  test('doesn\'t resolve with adjacent stuff', async () => {
    await getConnectedIssueForPR(github, {body: 'asdffor: openstax/rex-web#123'})
    await getConnectedIssueForPR(github, {body: 'for: openstax/rex-web#123asdf'})
    expect(github.issues.get).not.toHaveBeenCalled()
  })

  test('resolves with newlines', async () => {
    await getConnectedIssueForPR(github, {body: 'asdf\nfor: openstax/rex-web#123\nasdf'})
    expect(github.issues.get).toHaveBeenCalledWith({repo: 'rex-web', owner: 'openstax', issue_number: '123'})
  })

  test('resolves with carriage returns', async () => {
    await getConnectedIssueForPR(github, {body: 'asdf\r\nfor: openstax/rex-web#123\r\nasdf'})
    expect(github.issues.get).toHaveBeenCalledWith({repo: 'rex-web', owner: 'openstax', issue_number: '123'})
  })
})
