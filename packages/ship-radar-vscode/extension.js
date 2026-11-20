const vscode = require('vscode')

function calculateShipScore(repository, now = new Date()) {
  const pushedAt = new Date(repository.pushed_at)
  const ageHours = Number.isFinite(pushedAt.getTime())
    ? Math.max(1, (now.getTime() - pushedAt.getTime()) / 36e5)
    : 24 * 365
  const releasePulse = Math.max(18, Math.min(99, 100 - ageHours * 1.1))
  const issueCount = Number.isFinite(repository.open_issues_count) ? repository.open_issues_count : 0
  const issueHealth = issueCount > 0 ? Math.max(20, 88 - issueCount * 1.2) : 92
  const stars = Number.isFinite(repository.stargazers_count) ? repository.stargazers_count : 0
  const forks = Number.isFinite(repository.forks_count) ? repository.forks_count : 0
  const momentum = Math.min(99, 38 + Math.log10(stars + 10) * 8 + Math.log10(forks + 10) * 4)

  return {
    score: Math.round(releasePulse * 0.4 + issueHealth * 0.25 + momentum * 0.35),
    releasePulse: Math.round(releasePulse),
    issueHealth: Math.round(issueHealth),
    momentum: Math.round(momentum),
  }
}

function activate(context) {
  const disposable = vscode.commands.registerCommand('ship-radar.rankRepository', async () => {
    const fullName = await vscode.window.showInputBox({
      prompt: 'Repository to rank',
      placeHolder: 'facebook/react',
      validateInput: value => value?.trim().includes('/') ? null : 'Use owner/repository format',
    })
    if (!fullName) return

    await vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title: `Ranking ${fullName}` }, async () => {
      const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'ship-radar-vscode' }
      const token = await context.secrets.get('shipRadar.githubToken')
      if (token) headers.Authorization = `Bearer ${token}`

      const response = await fetch(`https://api.github.com/repos/${fullName.trim()}`, { headers })
      if (!response.ok) throw new Error(`GitHub API returned ${response.status}`)
      const repository = await response.json()
      const signals = calculateShipScore(repository)

      await vscode.window.showInformationMessage(
        `${repository.full_name}: Ship Score ${signals.score} · release ${signals.releasePulse} · issues ${signals.issueHealth} · momentum ${signals.momentum}`,
      )
    })
  })

  context.subscriptions.push(disposable)
}

function deactivate() {}
module.exports = { activate, deactivate }
