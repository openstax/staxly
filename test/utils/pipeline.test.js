const {getPipeline, getPipelineStage} = require('../../src/utils/pipeline')

const examplePipeline = `# pipeline
1A-PRE DESIGN
- [ ] PDM approves UX LoFi Design
- [ ] PDM approves UX HiFi Design

1C-DESIGN
- [x] PDM approves UX HiFi Design

2B-REVIEW
  - [ ] Developer approves change
  - [x] UX approves change
  - [ ] QA approves change
  - [x] PDM approves change
`

const expected = [
  {
    'name': '1A-PRE DESIGN',
    'complete': false,
    'items': [
      {'complete': false, 'name': 'PDM approves UX LoFi Design'},
      {'complete': false, 'name': 'PDM approves UX HiFi Design'}
    ]
  },
  {
    'name': '1C-DESIGN',
    'complete': true,
    'items': [
      {'complete': true, 'name': 'PDM approves UX HiFi Design'}
    ]
  },
  {
    'name': '2B-REVIEW',
    'complete': false,
    'items': [
      {'complete': false, 'name': 'Developer approves change'},
      {'complete': true, 'name': 'UX approves change'},
      {'complete': false, 'name': 'QA approves change'},
      {'complete': true, 'name': 'PDM approves change'}
    ]
  }
]

describe('getPipeline', () => {
  test('resolves basic pipeline', () => {
    const result = getPipeline(examplePipeline)
    expect(result).toEqual(expected)
  })

  test('resolves with text before', () => {
    const result = getPipeline('asdf\n\rasdf\n\rasdf\n\r' + examplePipeline)
    expect(result).toEqual(expected)
  })

  test('resolves with text around', () => {
    const result = getPipeline('asdf\n\rasdf\n\rasdf\n\r' + examplePipeline + 'asdf\n\rasdf\n\rasdf\n\r')
    expect(result).toEqual(expected)
  })

  test('resolves with text after', () => {
    const result = getPipeline(examplePipeline + 'asdf\n\rasdf\n\rasdf\n\r')
    expect(result).toEqual(expected)
  })

  test('pipeline title must be on ownline', () => {
    const result = getPipeline('asdf\n\rasdf\n\rasdf' + examplePipeline)
    expect(result).toEqual(null)
  })

  test('doesn\'t match pr block', () => {
    const result = getPipeline('pull requests: \n- [ ] https://github.com/openstax/rex-web/pulls/123')
    expect(result).toEqual(null)
  })

  test('doesn\'t match pr block earlier in body', () => {
    const result = getPipeline('pull requests: \n- [ ] https://github.com/openstax/rex-web/pulls/123\n\radsf\n\r' + examplePipeline)
    expect(result).toEqual(expected)
  })
})

describe('getPipelineStage', () => {
  test('gets stage', () => {
    const result = getPipelineStage(examplePipeline, '2B-REVIEW')
    expect(result).toEqual(expected[2])
  })

  test('returns null if not found', () => {
    const result = getPipelineStage(examplePipeline, 'asdf')
    expect(result).toEqual(null)
  })

  test('gets stage with matcher function', () => {
    const result = getPipelineStage(examplePipeline, name => name.includes('REVIEW'))
    expect(result).toEqual(expected[2])
  })

  test('matcher function fails', () => {
    const result = getPipelineStage(examplePipeline, name => name.includes('asdf'))
    expect(result).toEqual(null)
  })

  test('gets stage with matcher regex', () => {
    const result = getPipelineStage(examplePipeline, name => name.match(/review/i))
    expect(result).toEqual(expected[2])
  })

  test('matcher regex fails', () => {
    const result = getPipelineStage(examplePipeline, name => name.match(/review/))
    expect(result).toEqual(null)
  })
})
