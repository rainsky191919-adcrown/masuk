import assert from 'node:assert/strict'
import { JSDOM } from 'jsdom'
const dom = new JSDOM('<div id="root"></div>', { url: 'http://127.0.0.1:5186/' })
Object.assign(globalThis, { window: dom.window, document: dom.window.document, FormData: dom.window.FormData, IS_REACT_ACT_ENVIRONMENT: true })
globalThis.fetch = () => { throw new Error('Network forbidden in empty-state checks') }
window.HTMLElement.prototype.scrollIntoView = function () {}
const { createElement, act } = await import('react')
const { createRoot } = await import('react-dom/client')
const { default: Admin, setAdminFixture } = await import('./bundle-empty/admin.mjs')
const empty = () => ({ posts: [], replies: [], feedback: [], reports: [], roles: [], audit: [] })
const props = { user: { id: 'fixture-admin', name: 'Empty-state QA', role: 'admin' }, locations: [], onEdit() {}, onChanged() {}, showToast() {} }
const root = createRoot(document.getElementById('root'))
let key = 0
const mount = async fixture => {
  setAdminFixture(fixture)
  await act(async () => root.render(createElement(Admin, { ...props, key: ++key })))
}
const reports = () => document.getElementById('admin-reports').parentElement
const content = () => document.getElementById('admin-content').parentElement
const filter = async value => act(async () => {
  const select = reports().querySelector('select')
  select.value = value
  select.dispatchEvent(new window.Event('change', { bubbles: true }))
})
try {
  await mount(empty())
  for (const [value, title] of [['open', '当前没有待处理举报'], ['resolved', '当前没有已处理举报'], ['dismissed', '当前没有已驳回举报'], ['all', '当前没有举报记录']]) {
    await filter(value)
    assert.equal(reports().querySelector('[role=status] strong').textContent, title)
    assert.match(reports().querySelector('[role=status]').textContent, /本次载入/)
  }
  assert.equal(content().querySelector('h2').textContent, '讨论内容管理')
  assert.match(content().querySelector('[role=status]').textContent, /帖子、回复或到访反馈/)
  assert.equal(document.querySelector('[aria-controls=admin-content]').getAttribute('aria-label'), '前往讨论内容管理')
  console.log('PASS: four report states and discussion absence explain the loaded scope and next action')

  const completed = { ...empty(), reports: [{ id: 'resolved-only', status: 'resolved', target_type: 'post', target: 'unknown', reason: 'fixture', resolution: 'fixture complete', reporter: 'fixture', created_at: '2026-11-03T08:00:00Z' }] }
  await mount(completed)
  assert.match(reports().textContent, /当前没有待处理举报/)
  await filter('resolved')
  assert.equal(reports().querySelector('.admin-empty-state'), null)
  assert.match(reports().querySelector('article').textContent, /fixture complete/)
  await filter('all')
  assert.equal(reports().querySelectorAll('article').length, 1)
  console.log('PASS: no pending work is distinct from having no report history')

  for (const [kind, item, expected] of [
    ['posts', { id: 'p', title: 'Fixture post', body: 'Post text', author: 'Fixture', hidden: false }, 'Fixture post'],
    ['replies', { id: 'r', body: 'Fixture reply', author: 'Fixture', hidden: false }, 'Fixture reply'],
    ['feedback', { id: 'f', note: 'Fixture feedback only', author: 'Fixture', hidden: true }, 'Fixture feedback only'],
  ]) {
    await mount({ ...empty(), [kind]: [item] })
    assert.equal(content().querySelector('.admin-empty-state'), null)
    assert.match(content().querySelector('article').textContent, new RegExp(expected))
    const actions = [...content().querySelectorAll('button')].map(b => b.textContent)
    assert.ok(actions.includes(kind === 'feedback' ? '恢复内容' : '隐藏内容'))
    assert.equal(actions.includes('置顶'), kind === 'posts')
  }
  console.log('PASS: posts-only, replies-only and hidden-feedback-only each remain visible without a false empty state')

  let finish
  await mount(() => new Promise(resolve => { finish = resolve }))
  assert.match(document.querySelector('[role=status]').textContent, /正在载入后台/)
  assert.equal(document.querySelector('.admin-empty-state'), null)
  await act(async () => finish(empty()))
  assert.equal(document.querySelectorAll('.admin-empty-state').length, 2)
  await mount(() => { throw new Error('Fixture load failed') })
  assert.match(document.querySelector('[role=alert]').textContent, /Fixture load failed/)
  assert.equal(document.querySelector('.admin-empty-state'), null)
  setAdminFixture(empty())
  await act(async () => [...document.querySelectorAll('button')].find(b => b.textContent === '刷新后台').click())
  assert.equal(document.querySelector('[role=alert]'), null)
  assert.equal(document.querySelectorAll('.admin-empty-state').length, 2)
  console.log('PASS: pending and failed loads never claim empty results, refresh recovers normally')
  const lastLoaded = document.querySelector('.admin-refresh-status time').dateTime
  assert.ok(Number.isFinite(new Date(lastLoaded).getTime()))
  assert.match(document.querySelector('.admin-refresh-status').textContent, /上次成功载入.*UTC\+8/)
  setAdminFixture(() => { throw new Error('Fixture refresh failed') })
  await act(async () => [...document.querySelectorAll('button')].find(b => b.textContent === '刷新后台').click())
  assert.equal(document.querySelector('.admin-refresh-status time').dateTime, lastLoaded)
  assert.match(document.querySelector('[role=alert]').textContent, /Fixture refresh failed/)
  assert.equal(document.querySelector('.admin-empty-state'), null)
  console.log('PASS: last successful load time remains honest after a failed refresh')
} finally {
  await act(async () => root.unmount())
  dom.window.close()
}
