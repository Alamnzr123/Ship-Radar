#!/usr/bin/env node

import { calculateShipScore } from '../shared/ship-radar.mjs'

const args = process.argv.slice(2)
const helpRequested = args.includes('--help') || args.includes('-h')
const jsonRequested = args.includes('--json')
const repositories = args.filter(arg => !arg.startsWith('-') && arg !== '--json')

if (helpRequested || repositories.length === 0) {
  console.log(`Ship Radar CLI

Usage:
  npm run ship-radar -- owner/repo [owner/repo ...]
  npm run ship-radar -- owner/repo --json

Options:
  --json  Print JSON instead of the formatted table
  --help  Show this help text

Set GITHUB_TOKEN to increase GitHub API limits. Never place a token in browser code.
`)
  process.exit(helpRequested ? 0 : 1)
}

const compact = (value) => value >= 1000
  ? `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`
  : String(value)

async function getRepository(fullName) {
  const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'ship-radar-cli' }
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`

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
  results.sort((a, b) => b.shipScore - a.shipScore)

  if (jsonRequested) {
    console.log(JSON.stringify({ exportedAt: new Date().toISOString(), repositories: results }, null, 2))
  } else {
    console.log('\nShip Radar ranking\n')
    for (const [index, repo] of results.entries()) {
      console.log(`${String(index + 1).padStart(2, '0')}  ${repo.shipScore.toString().padStart(3)}  ${repo.repository}`)
      console.log(`    ${repo.language ?? 'Mixed'}  stars ${compact(repo.stars)}  forks ${compact(repo.forks)}  issues ${repo.openIssues}`)
    }
  }
} catch (error) {
  console.error(`Ship Radar: ${error.message}`)
  process.exit(1)
}
