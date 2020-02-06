const getConnectedPRsForIssue = require('../../src/utils/getConnectedPRsForIssue')

describe('getConnectedPRsForIssue', () => {
  test('resolves github ref', () => {
    const result = getConnectedPRsForIssue({body: 'pull requests: \n- [ ] openstax/rex-web#123'})
    expect(result).toEqual([{repo: 'rex-web', owner: 'openstax', issue_number: '123'}])
  })
  test('resolves github link', () => {
    const result = getConnectedPRsForIssue({body: 'pull requests: \n- [ ] https://github.com/openstax/rex-web/pulls/123'})
    expect(result).toEqual([{repo: 'rex-web', owner: 'openstax', issue_number: '123'}])
  })
  test('resolves zenhub link', () => {
    const result = getConnectedPRsForIssue({body: 'pull requests: \n- [ ] https://app.zenhub.com/workspaces/openstax-unified-5b71aabe3815ff014b102258/issues/openstax/unified/123'})
    expect(result).toEqual([{repo: 'unified', owner: 'openstax', issue_number: '123'}])
  })
  test('resolves empty list', () => {
    const result = getConnectedPRsForIssue({body: 'pull requests:\n\r\n\rasdf'})
    expect(result).toEqual([])
  })
  test('resolves multiple PRs', () => {
    const result = getConnectedPRsForIssue({body: 'pull requests: \n- [ ] openstax/rex-web#123\n- [ ] openstax/rex-web#234'})
    expect(result).toEqual([
      {repo: 'rex-web', owner: 'openstax', issue_number: '123'},
      {repo: 'rex-web', owner: 'openstax', issue_number: '234'}
    ])
  })
  test('resolves bold', () => {
    const result = getConnectedPRsForIssue({body: '**pull requests**: \n- [ ] openstax/rex-web#123'})
    expect(result).toEqual([{repo: 'rex-web', owner: 'openstax', issue_number: '123'}])
  })
  test('resolves italic', () => {
    const result = getConnectedPRsForIssue({body: '*pull requests:* \n- [ ] openstax/rex-web#123'})
    expect(result).toEqual([{repo: 'rex-web', owner: 'openstax', issue_number: '123'}])
  })
  test('resolves heading', () => {
    const result = getConnectedPRsForIssue({body: '# pull requests \n- [ ] openstax/rex-web#123'})
    expect(result).toEqual([{repo: 'rex-web', owner: 'openstax', issue_number: '123'}])
  })
  test('resolves sub heading', () => {
    const result = getConnectedPRsForIssue({body: '### pull requests \n- [ ] openstax/rex-web#123'})
    expect(result).toEqual([{repo: 'rex-web', owner: 'openstax', issue_number: '123'}])
  })
  test('resolves deep in body', () => {
    const result = getConnectedPRsForIssue({body: 'asdf\r\nasdf\r\nasdf\r\n### pull requests \r\n- [ ] openstax/rex-web#123'})
    expect(result).toEqual([{repo: 'rex-web', owner: 'openstax', issue_number: '123'}])
  })
  test('but not without the whitespace', () => {
    const result = getConnectedPRsForIssue({body: 'asdf\r\nasdf\r\nasdf### pull requests \r\n- [ ] openstax/rex-web#123'})
    expect(result).toEqual([])
  })
})
