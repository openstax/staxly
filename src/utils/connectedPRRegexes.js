import {
  githubRefGroups, githubPullRequestLinkGroups, zenhubLinkGroups,
  githubRef, githubPullRequestLink, zenhubLink
} from './regexes.js'

export const anyLink = `((${githubRef})|(${githubPullRequestLink})|(${zenhubLink}))`

export const anyLinkGroups = [
  githubRefGroups,
  githubPullRequestLinkGroups,
  zenhubLinkGroups
]
