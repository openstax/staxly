import {
  githubRefGroups, githubPullRequestLinkGroups, zenhubLinkGroups,
  githubRef, githubPullRequestLink, zenhubLink
} from './regexes'

export const anyLink = `((${githubRef})|(${githubPullRequestLink})|(${zenhubLink}))`

export const anyLinkGroups = [
  githubRefGroups,
  githubPullRequestLinkGroups,
  zenhubLinkGroups
]
