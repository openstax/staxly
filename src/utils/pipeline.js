const {
  whitespace, newline, newlineCharacters, beginningOfStringOrNewline
} = require('./regexes')

const stageItem = `${newline}+${whitespace}*\\- \\[(?<checked> |x)\\] (?<itemName>[^${newlineCharacters}]+)`
const stageName = `${whitespace}*${newline}#* ?\\*{0,2}(?<stage>[a-z0-9]+[^${newlineCharacters}]*):?\\*{0,2}:?`;
const stageBlock = `${stageName}(${whitespace}*${stageItem})+`

const pipelineHeading = `#* ?\\*{0,2}pipeline:?\\*{0,2}:?`
const pipelineBlock = `${beginningOfStringOrNewline}${pipelineHeading}${whitespace}*(?<pipeline>(${stageBlock})+)`

const getPipelineBody = (body) => {
  const blockMatch = body.match(new RegExp(pipelineBlock, 'i'));
  return blockMatch && blockMatch.groups.pipeline;
}

const getPipeline = (body) => {
  const pipeline = getPipelineBody(body);

  if (!pipeline) {
    return null;
  }

  const stageBodies = pipeline.match(new RegExp(stageBlock, 'gi'));

  return stageBodies.map(stageBody => {
    const name = stageBody.match(new RegExp(stageBlock, 'i')).groups.stage;
    const itemBodies = stageBody.match(new RegExp(stageItem, 'gi'));

    const items = itemBodies.map(itemBody => {
      const {checked, itemName} = itemBody.match(new RegExp(stageItem, 'i')).groups;
      return {
        complete: checked === 'x',
        name: itemName,
      }
    });

    const complete = !items.find(item => !item.complete);

    return {
      complete: complete,
      name: name,
      items: items,
    };
  });
}

const getPipelineStage = (body, name) => {
  const pipeline = getPipeline(body);

  if (!pipeline) {
    return null;
  }

  return pipeline.find(stage => stage.name === name) || null;
}

module.exports = {
  getPipeline,
  getPipelineStage,
}
