const { whitespace, beginningOfStringOrNewline, newline, newlineCharacters } = require('./regexes')

const blockItem = `${newline}+${whitespace}*\\- (?<name>[^:]+): (?<version>[^${newlineCharacters}]+)`
const blockItems = `(${blockItem})+`
const versionBlockRegex = `${beginningOfStringOrNewline}(?<block>#* ?\\*{0,2}versions:?\\*{0,2}:?${blockItems}`

const getVersionsBlock = (body) => {
  const blockMatch = body.match(new RegExp(versionBlockRegex, 'i'))
  return blockMatch && blockMatch.groups.block
}

const getVersions = (body) => {
  const versionsText = getVersionsBlock(body)

  if (!versionsText) {
    return null
  }

  return versionsText.match(new RegExp(blockItem, 'gi'))
    .map(itemText => itemText.match(new RegExp(blockItem, 'i')).groups)
    .reduce((result, item) => ({...result, [item.name]: item.version}), {})
}

const getItemVersion = (body, itemName) => {
  const versions = getVersions(body)

  if (!versions) {
    return null
  }

  return versions[itemName]
}

const setBlockVersions = (body, versions) => {
  const versionsText = getVersionsBlock(body)
  const itemsText = versionsText && versionsText.match(new RegExp(blockItems, 'i'))

  const newItemsText = Object.entries(versions).reduce((result, [name, version]) =>
    result + `\n- ${name}: ${version}`
    , '')

  return itemsText
    ? body.replace(itemsText, newItemsText)
    : body + '\n\nversions:' + newItemsText
}

const setItemVersion = (body, itemName, version) => {
  const versions = getVersions(body) || {}
  return setBlockVersions(body, {...versions, [itemName]: version})
}

module.exports = {
  getVersions,
  getItemVersion,
  setBlockVersions,
  setItemVersion
}
