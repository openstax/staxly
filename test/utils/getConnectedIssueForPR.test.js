const getConnectedIssueForPR = require('../../src/utils/getConnectedIssueForPR')

describe('getConnectedIssueForPR', () => {
  test('resolves github ref', () => {
    const result = getConnectedIssueForPR({body: 'for: openstax/rex-web#123'})
    expect(result).toEqual({repo: 'rex-web', owner: 'openstax', issue_number: '123'})
  })

  test('resolves github ref, case insensitive', () => {
    const result = getConnectedIssueForPR({body: 'for: OpenStax/rex-web#123'})
    expect(result).toEqual({repo: 'rex-web', owner: 'OpenStax', issue_number: '123'})
  })

  test('resolves github link', () => {
    const result = getConnectedIssueForPR({body: 'for: https://github.com/openstax/unified/issues/123'})
    expect(result).toEqual({repo: 'unified', owner: 'openstax', issue_number: '123'})
  })

  test('resolves zenhub link', () => {
    const result = getConnectedIssueForPR({body: 'for: https://app.zenhub.com/workspaces/openstax-unified-5b71aabe3815ff014b102258/issues/openstax/unified/123'})
    expect(result).toEqual({repo: 'unified', owner: 'openstax', issue_number: '123'})
  })

  test('resolves with stuff around', () => {
    const result = getConnectedIssueForPR({body: 'asdf\nasdf\nasdf\nasdf for: openstax/rex-web#123 asdf'})
    expect(result).toEqual({repo: 'rex-web', owner: 'openstax', issue_number: '123'})
  })

  test('doesn\'t resolve with adjacent stuff', () => {
    const result1 = getConnectedIssueForPR({body: 'asdffor: openstax/rex-web#123'})
    const result2 = getConnectedIssueForPR({body: 'for: openstax/rex-web#123asdf'})
    expect(result1).toBe(null)
    expect(result2).toBe(null)
  })

  test('resolves with newlines', () => {
    const result = getConnectedIssueForPR({body: 'asdf\nfor: openstax/rex-web#123\nasdf'})
    expect(result).toEqual({repo: 'rex-web', owner: 'openstax', issue_number: '123'})
  })

  test('resolves with carriage returns', () => {
    const result = getConnectedIssueForPR({body: 'asdf\r\nfor: openstax/rex-web#123\r\nasdf'})
    expect(result).toEqual({repo: 'rex-web', owner: 'openstax', issue_number: '123'})
  })
})
