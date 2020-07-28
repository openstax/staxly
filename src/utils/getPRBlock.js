import { whitespace, beginningOfStringOrNewline, listPrefix } from './regexes.js'
import { anyLink } from './connectedPRRegexes.js'

const prBlockRegex = `${beginningOfStringOrNewline}(?<block>#* ?\\*{0,2}pull requests:?\\*{0,2}:?(${whitespace}*${listPrefix}${anyLink})*)`

export default (body) => {
  const blockMatch = body.match(new RegExp(prBlockRegex, 'i'))
  return blockMatch && blockMatch.groups.block
}
