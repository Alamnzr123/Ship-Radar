#!/usr/bin/env node

import { calculateShipScore } from '../shared/ship-radar.mjs'

const args = process.argv.slice(2)
const jsonRequested = args.includes('--json')
const helpRequested = args.includes('--help') || args.includes('-h')
const repositories = args.filter(arg => !arg.startsWith('-'))

if (helpRequested) {
  console.log(`Ship Radar

Usage:
  npx ship-radar owner/repo [owner/repo ...]
  npx ship-radar owner/repo --json

Options:
  --json  Print machine-readable JSON
  --help  Show this help text

Set GITHUB_TOKEN to increase GitHub API limits.
`)
  process.exit(0)
}

if (repositories.length === 0) {
  console.error('Ship Radar: provide at least one owner/repository.')
  process.exit(1)
}

const headers = {
  Accept: 'application/vnd.github+json',
  'User-Agent': 'ship-radar-cli',
}
if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`

async function getRepository(fullName) {
  const response = await fetch(`https://api.github.com/repos/${fullName}`, { headers })
  if (!response.ok) throw new Error(`${fullName}: GitHub API returned ${response.status}`)
  const repo = await response.json()
  const signals = calculateShipScore(repo)

  return {
    repository: repo.full_name,
    url: repo.html_url,
    language: repo.language,
    shipScore: signals.score,
    releasePulse: signals.releasePulse,
    issueHealth: signals.issueHealth,
    momentum: signals.momentum,
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    openIssues: repo.open_issues_count,
  }
}

try {
  const results = await Promise.all(repositories.map(getRepository))
  results.sort((left, right) => right.shipScore - left.shipScore)

  if (jsonRequested) {
    console.log(JSON.stringify({ exportedAt: new Date().toISOString(), repositories: results }, null, 2))
  } else {
    console.log('\nShip Radar ranking\n')
    for (const [index, repo] of results.entries()) {
      console.log(`${String(index + 1).padStart(2, '0')}  ${repo.shipScore.toString().padStart(3)}  ${repo.repository}`)
      console.log(`    ${repo.language ?? 'Mixed'}  stars ${repo.stars}  forks ${repo.forks}  issues ${repo.openIssues}`)
    }
  }
} catch (error) {
  console.error(`Ship Radar: ${error instanceof Error ? error.message : String(error)}`)
  process.exit(1)
}
