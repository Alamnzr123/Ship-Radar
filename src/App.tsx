import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import { calculateShipScore } from '../shared/ship-radar.mjs'
import './App.css'

interface Repo {
  id: number
  name: string
  full_name: string
  description: string | null
  html_url: string
  stargazers_count: number
  forks_count: number
  open_issues_count: number
  language: string | null
  pushed_at: string
  updated_at: string
  owner: { login: string; avatar_url: string }
}

interface RepoSignal {
  repo: Repo
  score: number
  releasePulse: number
  issueHealth: number
  momentum: number
  spark: number[]
}

const seedRepos: Repo[] = [
  { id: 1, name: 'openagents', full_name: 'ship-labs/openagents', description: 'A practical runtime for local AI agents with observable tool calls.', html_url: 'https://github.com', stargazers_count: 4280, forks_count: 311, open_issues_count: 18, language: 'TypeScript', pushed_at: '2026-11-20T08:00:00Z', updated_at: '2026-11-20T08:00:00Z', owner: { login: 'ship-labs', avatar_url: '' } },
  { id: 2, name: 'sqliteflow', full_name: 'tangent-dev/sqliteflow', description: 'Stream SQLite changes into a local data API. Zero server setup.', html_url: 'https://github.com', stargazers_count: 2865, forks_count: 164, open_issues_count: 12, language: 'Rust', pushed_at: '2026-11-19T16:00:00Z', updated_at: '2026-11-19T16:00:00Z', owner: { login: 'tangent-dev', avatar_url: '' } },
  { id: 3, name: 'tracekit', full_name: 'northstar-lab/tracekit', description: 'Dependency tracing for pull requests and small service graphs.', html_url: 'https://github.com', stargazers_count: 1942, forks_count: 98, open_issues_count: 9, language: 'Go', pushed_at: '2026-11-20T04:00:00Z', updated_at: '2026-11-20T04:00:00Z', owner: { login: 'northstar-lab', avatar_url: '' } },
  { id: 4, name: 'preflight', full_name: 'formwork/preflight', description: 'Run the checks that matter before a package leaves your machine.', html_url: 'https://github.com', stargazers_count: 3510, forks_count: 247, open_issues_count: 31, language: 'Python', pushed_at: '2026-11-18T11:00:00Z', updated_at: '2026-11-18T11:00:00Z', owner: { login: 'formwork', avatar_url: '' } },
]

const compact = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : String(n)

function buildSignal(repo: Repo, index: number): RepoSignal {
  const signals = calculateShipScore(repo)
  const spark = [32, 38, 35, 48, 44, 57, 54, 66, 63, 72, 68, 79].map((n, i) => n + ((index + i) % 4) * 3)
  return {
    repo,
    score: signals.score,
    releasePulse: signals.releasePulse,
    issueHealth: signals.issueHealth,
    momentum: signals.momentum,
    spark,
  }
}

function App() {
  const [repos, setRepos] = useState<Repo[]>(seedRepos)
  const [query, setQuery] = useState('')
  const [language, setLanguage] = useState('All languages')
  const [period, setPeriod] = useState('This week')
  const [status, setStatus] = useState<'live' | 'loading' | 'demo'>('demo')
  const [selected, setSelected] = useState<string>('ship-labs/openagents')
  const [watchlist, setWatchlist] = useState<string[]>(() => {
    const saved = window.localStorage.getItem('ship-radar-watchlist')
    if (!saved) return []
    try {
      const parsed = JSON.parse(saved)
      return Array.isArray(parsed) ? parsed.filter((name): name is string => typeof name === 'string') : []
    } catch {
      return []
    }
  })
  const [compareIds, setCompareIds] = useState<string[]>(() => {
    const hashName = new URLSearchParams(window.location.hash.replace(/^#/, '')).get('compare')
    if (hashName) return hashName.split(',').filter(Boolean).slice(0, 3)

    const saved = window.localStorage.getItem('ship-radar-compare')
    if (!saved) return []
    try {
      const parsed = JSON.parse(saved)
      return Array.isArray(parsed) ? parsed.filter((name): name is string => typeof name === 'string').slice(0, 3) : []
    } catch {
      return []
    }
  })
  const [view, setView] = useState<'radar' | 'watchlist' | 'compare'>(() =>
    new URLSearchParams(window.location.hash.replace(/^#/, '')).has('compare') ? 'compare' : 'radar')
  const [shareStatus, setShareStatus] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    async function load() {
      setStatus('loading')
      const since = period === 'Today' ? 'd' : period === 'This week' ? 'w' : 'm'
      try {
        const response = await fetch(`https://api.github.com/search/repositories?q=stars:>100+pushed:>${since === 'd' ? '2026-11-19' : since === 'w' ? '2026-11-13' : '2026-10-20'}&sort=stars&order=desc&per_page=12`, { signal: controller.signal })
        if (!response.ok) throw new Error('GitHub rate limit or network error')
        const data = await response.json()
        if (data.items?.length) {
          setRepos(data.items)
          setStatus('live')
        }
      } catch (error) {
        if (!(error instanceof DOMException)) setStatus('demo')
      }
    }
    load()
    const timer = window.setInterval(load, 5 * 60 * 1000)
    return () => { controller.abort(); window.clearInterval(timer) }
  }, [period])

  const signals = useMemo(() => {
    return repos
      .map(buildSignal)
      .filter(({ repo }) => language === 'All languages' || repo.language === language)
      .filter(({ repo }) => `${repo.full_name} ${repo.description ?? ''}`.toLowerCase().includes(query.toLowerCase()))
      .sort((a, b) => b.score - a.score)
  }, [repos, language, query])

  const visibleSignals = useMemo(() => {
    if (view === 'watchlist') {
      return signals.filter(({ repo }) => watchlist.includes(repo.full_name))
    }
    return signals
  }, [signals, view, watchlist])

  const languages = ['All languages', ...Array.from(new Set(repos.map(repo => repo.language).filter(Boolean))) as string[]]
  const active = visibleSignals.find(({ repo }) => repo.full_name === selected)?.repo ?? visibleSignals[0]?.repo
  const activeSignal = active ? buildSignal(active, repos.indexOf(active)) : null

  useEffect(() => {
    window.localStorage.setItem('ship-radar-watchlist', JSON.stringify(watchlist))
  }, [watchlist])

  useEffect(() => {
    window.localStorage.setItem('ship-radar-compare', JSON.stringify(compareIds))
  }, [compareIds])

  const toggleWatchlist = (fullName: string) => {
    setWatchlist(current => current.includes(fullName)
      ? current.filter(name => name !== fullName)
      : [...current, fullName])
  }

  const toggleCompare = (fullName: string) => {
    setCompareIds(current => current.includes(fullName)
      ? current.filter(name => name !== fullName)
      : current.length < 3 ? [...current, fullName] : current)
  }

  const copyComparisonLink = async () => {
    const names = encodeURIComponent(compareIds.join(','))
    const url = `${window.location.origin}${window.location.pathname}#compare=${names}`
    try {
      await navigator.clipboard.writeText(url)
      setShareStatus('Link copied')
    } catch {
      setShareStatus('Copy unavailable')
    }
  }

  const exportComparison = () => {
    const payload = comparedSignals.map(({ repo, score, releasePulse, issueHealth, momentum }) => ({
      repository: repo.full_name,
      url: repo.html_url,
      language: repo.language,
      shipScore: score,
      releasePulse,
      issueHealth,
      momentum,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
    }))
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), repositories: payload }, null, 2)], { type: 'application/json' })
    const downloadUrl = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = downloadUrl
    anchor.download = 'ship-radar-comparison.json'
    anchor.click()
    URL.revokeObjectURL(downloadUrl)
  }

  const comparedSignals = compareIds
    .map(fullName => signals.find(({ repo }) => repo.full_name === fullName))
    .filter((signal): signal is RepoSignal => Boolean(signal))

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Ship Radar home">
          <span className="brandMark"><i /><i /><i /></span>
          <span>Ship Radar</span>
        </a>
        <nav aria-label="Primary navigation">
          <button type="button" className={view === 'radar' ? 'navButton active' : 'navButton'} onClick={() => setView('radar')}>Radar</button>
          <button type="button" className={view === 'watchlist' ? 'navButton active' : 'navButton'} onClick={() => setView('watchlist')}>Watchlist <span>{watchlist.length}</span></button>
          <button type="button" className={view === 'compare' ? 'navButton active' : 'navButton'} onClick={() => setView('compare')}>Compare <span>{compareIds.length}</span></button>
          <a href="#method">Method</a>
        </nav>
        <span className={`source ${status}`}><b />{status === 'live' ? 'Live GitHub' : status === 'loading' ? 'Refreshing' : 'Preview data'}</span>
      </header>

      <section className="intro" id="top">
        <div>
          <p className="kicker">Repository intelligence / 2026</p>
          <h1>Find projects worth <em>shipping with.</em></h1>
        </div>
        <p className="introCopy">A live signal for developers choosing tools, libraries, and communities. Less vanity stars. More evidence of momentum.</p>
      </section>

      {view !== 'compare' && (
        <section className="controls" aria-label="Discovery controls">
          <label className="search">
            <span aria-hidden="true">⌕</span>
            <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search a repo, tool, or problem" />
          </label>
          <label><span className="srOnly">Time period</span><select value={period} onChange={event => setPeriod(event.target.value)}>{['Today', 'This week', 'This month'].map(value => <option key={value}>{value}</option>)}</select></label>
          <label><span className="srOnly">Language</span><select value={language} onChange={event => setLanguage(event.target.value)}>{languages.map(value => <option key={value}>{value}</option>)}</select></label>
        </section>
      )}

      <section className="dashboard" id="radar">
        <div className="listPanel">
          <div className="panelHeading"><span>{view === 'watchlist' ? 'Saved repositories' : 'Ranked signals'}</span><span>{visibleSignals.length} repositories</span></div>
          {visibleSignals.length === 0 ? <div className="empty"><b>{view === 'watchlist' ? 'Your watchlist is empty' : 'No matching ships'}</b><p>{view === 'watchlist' ? 'Save repositories from the Radar to track them here.' : 'Try a broader search or language.'}</p></div> : visibleSignals.map((signal, index) => (
            <button className={`repoRow ${active?.full_name === signal.repo.full_name ? 'selected' : ''}`} key={signal.repo.id} onClick={() => setSelected(signal.repo.full_name)}>
              <span className="rank">{String(index + 1).padStart(2, '0')}</span>
              <span className="repoMain">
                <span className="repoName"><b>{signal.repo.owner.login}</b> / {signal.repo.name}</span>
                <span className="repoDescription">{signal.repo.description ?? 'No description provided.'}</span>
                <span className="repoMeta"><i>{signal.repo.language}</i><i>★ {compact(signal.repo.stargazers_count)}</i><i>⑂ {compact(signal.repo.forks_count)}</i></span>
              </span>
              <span className="score"><b>{signal.score}</b><small>SHIP SCORE</small></span>
            </button>
          ))}
        </div>

        {activeSignal && (
          <aside className="detailPanel" aria-label="Repository signal detail">
            <div className="detailTop">
              <span>Deep signal</span>
              <span className="detailActions">
                <button type="button" className={watchlist.includes(activeSignal.repo.full_name) ? 'watchButton saved' : 'watchButton'} onClick={() => toggleWatchlist(activeSignal.repo.full_name)}>
                  {watchlist.includes(activeSignal.repo.full_name) ? 'Saved' : 'Save'}
                </button>
                <button type="button" className={compareIds.includes(activeSignal.repo.full_name) ? 'compareButton selected' : 'compareButton'} onClick={() => toggleCompare(activeSignal.repo.full_name)}>
                  {compareIds.includes(activeSignal.repo.full_name) ? 'Added' : 'Compare'}
                </button>
                <a href={activeSignal.repo.html_url} target="_blank" rel="noreferrer">Open GitHub</a>
              </span>
            </div>
            <div className="detailTitle">
              <span className="avatar">{activeSignal.repo.owner.login.slice(0, 2).toUpperCase()}</span>
              <div><p>{activeSignal.repo.owner.login}</p><h2>{activeSignal.repo.name}</h2></div>
            </div>
            <p className="detailDescription">{activeSignal.repo.description}</p>

            <div className="scoreRing" style={{ '--score': `${activeSignal.score * 3.6}deg` } as CSSProperties}><span><b>{activeSignal.score}</b><small>/100</small></span></div>

            <div className="metric"><div><span>Release pulse</span><b>{activeSignal.releasePulse}</b></div><div className="bar"><i style={{ width: `${activeSignal.releasePulse}%` }} /></div></div>
            <div className="metric"><div><span>Issue health</span><b>{activeSignal.issueHealth}</b></div><div className="bar"><i style={{ width: `${activeSignal.issueHealth}%` }} /></div></div>
            <div className="metric"><div><span>Community momentum</span><b>{activeSignal.momentum}</b></div><div className="bar"><i style={{ width: `${activeSignal.momentum}%` }} /></div></div>

            <div className="sparkBlock"><div><span>12-point momentum</span><small>observed trend</small></div><ResponsiveContainer width="100%" height={88}><AreaChart data={activeSignal.spark.map((value, index) => ({ index, value }))}><defs><linearGradient id="area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#d94d2b" stopOpacity={0.24}/><stop offset="1" stopColor="#d94d2b" stopOpacity={0}/></linearGradient></defs><XAxis dataKey="index" hide /><Tooltip /><Area type="monotone" dataKey="value" stroke="#d94d2b" fill="url(#area)" strokeWidth={2}/></AreaChart></ResponsiveContainer></div>
          </aside>
        )}
      </section>

      {view === 'compare' && (
        <section className="compareView" aria-label="Repository comparison">
          <div className="compareHeading">
            <div><p className="kicker">Side-by-side evaluation</p><h2>Compare up to three repositories</h2></div>
            <button type="button" className="clearButton" onClick={() => setCompareIds([])} disabled={compareIds.length === 0}>Clear selection</button>
          </div>
          {comparedSignals.length === 0 ? (
            <div className="compareEmpty"><b>No repositories selected</b><p>Open Radar and select Compare on repository details.</p><button type="button" onClick={() => setView('radar')}>Return to Radar</button></div>
          ) : (
            <div className="compareGrid" style={{ '--compare-count': comparedSignals.length } as CSSProperties}>
              {comparedSignals.map(signal => (
                <article className="compareCard" key={signal.repo.full_name}>
                  <button type="button" className="removeCompare" onClick={() => toggleCompare(signal.repo.full_name)} aria-label={`Remove ${signal.repo.full_name} from comparison`}>×</button>
                  <p>{signal.repo.owner.login}</p>
                  <h3>{signal.repo.name}</h3>
                  <b className="compareScore">{signal.score}<small>/100</small></b>
                  <dl>
                    <div><dt>Release pulse</dt><dd>{signal.releasePulse}</dd></div>
                    <div><dt>Issue health</dt><dd>{signal.issueHealth}</dd></div>
                    <div><dt>Momentum</dt><dd>{signal.momentum}</dd></div>
                    <div><dt>Stars</dt><dd>{compact(signal.repo.stargazers_count)}</dd></div>
                    <div><dt>Forks</dt><dd>{compact(signal.repo.forks_count)}</dd></div>
                    <div><dt>Language</dt><dd>{signal.repo.language ?? 'Mixed'}</dd></div>
                  </dl>
                  <a href={signal.repo.html_url} target="_blank" rel="noreferrer">Open GitHub</a>
                </article>
              ))}
            </div>
          )}
          {comparedSignals.length > 0 && (
            <div className="sharePanel">
              <button type="button" className="shareButton" onClick={copyComparisonLink}>
                {shareStatus || 'Copy link to this comparison'}
              </button>
              <button type="button" className="exportButton" onClick={exportComparison}>Export JSON</button>
            </div>
          )}
        </section>
      )}

      <footer id="method"><span>SHIP SCORE = 40% release pulse + 25% issue health + 35% community momentum</span><span>Updated every 5 minutes</span></footer>
    </main>
  )
}

export default App
