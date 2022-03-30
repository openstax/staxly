import { whitespace, beginningOfStringOrNewline, newline, newlineCharacters } from './regexes.js'

const blockItem = `${newline}+${whitespace}*\\- (?<name>[^:]+): (?<version>[^ ${newlineCharacters}]+)(?<locked> \\(locked\\))?`
const blockItems = `(${blockItem})+`
const versionBlockRegex = `${beginningOfStringOrNewline}(?<block>#* ?\\*{0,2}versions:?\\*{0,2}:?${blockItems})`

const getVersionsBlock = (body) => {
  const blockMatch = body.match(new RegExp(versionBlockRegex, 'i'))
  return blockMatch && blockMatch.groups.block
}

export const getVersions = (body, filter = () => true) => {
  const versionsText = getVersionsBlock(body)

  if (!versionsText) {
    return null
  }

  return versionsText.match(new RegExp(blockItem, 'gi'))
    .map(itemText => {
      const { groups } = itemText.match(new RegExp(blockItem, 'i'))
      return { ...groups, locked: !!groups.locked }
    })
    .filter(filter)
    .reduce((result, item) => ({ ...result, [item.name]: item.version }), {})
}

export const getVersion = (body, itemName) => {
  const versions = getVersions(body)
  /* istanbul ignore if */
  if (!versions) {
    return null
  }

  return versions[itemName]
}

export const setVersions = (body, versions) => {
  const lockedVersions = getVersions(body, item => item.locked) || {}
  const newVersions = { ...versions, ...lockedVersions }
  const versionsText = getVersionsBlock(body)
  const itemsText = versionsText && versionsText.match(new RegExp(blockItems, 'i'))[0]

  const newItemsText = Object.entries(newVersions).reduce((result, [name, version]) =>
    result + `\n- ${name}: ${version}${name in lockedVersions ? ' (locked)' : ''}`
  , '')

  return itemsText
    ? body.replace(itemsText, newItemsText)
    : body + '\n\nversions:' + newItemsText
}

export const setVersion = (body, itemName, version) => {
  const versions = getVersions(body) || {}

  return setVersions(body, {
    ...versions,
    [itemName]: version
  })
}
