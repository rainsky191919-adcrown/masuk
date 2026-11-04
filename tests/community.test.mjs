import test from 'node:test'
import assert from 'node:assert/strict'
import { summarize, requirement } from '../src/lib/community.js'

const now = Date.parse('2026-11-03T10:00:00Z')
const location = { id: 'one' }
const report = (id, level, date = '2026-11-02T10:00:00Z', locationId = 'one') => ({ authorId: id, level, visitedAt: date, locationId })

test('missing requirements remain unknown instead of being treated as yes', () => {
  for (const value of ['待确认', null, undefined]) assert.equal(requirement(value), '待确认')
  assert.equal(requirement(true), '需要')
  assert.equal(requirement(false), '不用')
})

test('public rating and fewer than three visits cannot establish friendliness', () => {
  assert.equal(summarize({ ...location, difficulty_level: 2 }, [], now).level, 0)
  assert.equal(summarize(location, [report('a', 1), report('b', 1)], now).level, 0)
})

test('recent local reports establish the level; stale, future and other locations are excluded', () => {
  const result = summarize(location, [report('a', 2), report('b', 3), report('c', 4), report('d', 5, '2026-09-01T00:00:00Z'), report('e', 5, '2026-12-01T00:00:00Z'), report('f', 5, undefined, 'two')], now)
  assert.equal(result.level, 3)
  assert.equal(result.count, 3)
  assert.equal(result.disputed, false)
})

test('conflicting experiences are surfaced instead of hidden by the average', () => {
  const result = summarize(location, [report('a', 1), report('b', 5), report('c', 3)], now)
  assert.equal(result.disputed, true)
  assert.equal(result.level, 3)
})
