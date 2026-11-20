export interface ShipSignals {
  score: number
  releasePulse: number
  issueHealth: number
  momentum: number
}

export interface RepositoryMetrics {
  pushed_at?: string
  open_issues_count?: number
  stargazers_count?: number
  forks_count?: number
}

export function calculateShipScore(repository: RepositoryMetrics, now?: Date): ShipSignals
export function rankRepositories(repositories: RepositoryMetrics[], now?: Date): Array<{ repository: RepositoryMetrics; signals: ShipSignals }>
