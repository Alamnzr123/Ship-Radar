import test from 'node:test'
import assert from 'node:assert/strict'
import { calculateShipScore, rankRepositories } from '../shared/ship-radar.mjs'

const now = new Date('2026-11-20T12:00:00Z')

test('recent active repository keeps high release pulse', () => {
  const result = calculateShipScore({
    pushed_at: '2026-11-20T11:00:00Z',
    open_issues_count: 10,
    stargazers_count: 1000,
    forks_count: 100,
  }, now)

  assert.equal(result.releasePulse, 99)
  assert.equal(result.issueHealth, 76)
  assert.equal(result.score, 83)
})

test('repository without issues receives healthy issue score', () => {
  const result = calculateShipScore({
    pushed_at: '2026-11-19T12:00:00Z',
    open_issues_count: 0,
    stargazers_count: 0,
    forks_count: 0,
  }, now)

  assert.equal(result.issueHealth, 92)
})

test('ranking sorts highest score first', () => {
  const ranked = rankRepositories([
    { pushed_at: '2020-11-20T12:00:00Z', open_issues_count: 100, stargazers_count: 1, forks_count: 1 },
    { pushed_at: '2026-11-20T12:00:00Z', open_issues_count: 2, stargazers_count: 1000, forks_count: 100 },
  ], now)

  assert.equal(ranked[0].signals.score, 86)
  assert.equal(ranked[1].signals.score, 30)
})

test('invalid pushed date is capped instead of producing NaN', () => {
  const result = calculateShipScore({ pushed_at: 'not-a-date', open_issues_count: 5, stargazers_count: 10, forks_count: 2 }, now)
  assert.ok(Number.isFinite(result.score))
  assert.ok(result.releasePulse >= 18)
})
