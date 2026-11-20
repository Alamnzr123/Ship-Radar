#!/usr/bin/env node

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

  const ageHours = Math.max(1, (Date.now() - new Date(repo.pushed_at).getTime()) / 36e5)
  const releasePulse = Math.max(18, Math.min(99, 100 - ageHours * 1.1))
  const issueHealth = repo.open_issues_count > 0
    ? Math.max(20, 88 - repo.open_issues_count * 1.2)
    : 92
  const momentum = Math.min(99, 38 + Math.log10(repo.stargazers_count + 10) * 8 + Math.log10(repo.forks_count + 10) * 4)
  const shipScore = Math.round(releasePulse * 0.4 + issueHealth * 0.25 + momentum * 0.35)

  return {
    repository: repo.full_name,
    url: repo.html_url,
    language: repo.language,
    shipScore,
    releasePulse: Math.round(releasePulse),
    issueHealth: Math.round(issueHealth),
    momentum: Math.round(momentum),
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
