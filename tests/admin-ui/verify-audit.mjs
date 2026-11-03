import assert from 'node:assert/strict'
import { JSDOM } from 'jsdom'
import { auditFixture } from './audit-fixture.mjs'
import { mockLocations } from '../../src/data.skudai.js'
const dom = new JSDOM('<!doctype html><div id="root"></div>', { url: 'http://127.0.0.1:5186/' })
Object.assign(globalThis, { window: dom.window, document: dom.window.document, IS_REACT_ACT_ENVIRONMENT: true })
globalThis.fetch = () => { throw new Error('No network allowed in audit log UI tests') }
window.HTMLElement.prototype.scrollIntoView = function () {}
const { createElement, act } = await import('react')
const { createRoot } = await import('react-dom/client')
const { default: AuditLog } = await import('./bundle-audit/audit.mjs')
const records = [...auditFixture, { id: 'invalid-time', action: 'constructor', actor: null, target: 'raw-target-unknown', reason: '', created_at: 'not-a-date' }]
const snapshot = structuredClone(records)
let props = { records, locations: mockLocations, context: { roles: [{ user_id: 'fixture-admin', email: 'moderator@example.test' }], posts: [{ id: 'post-preview-0001', title: '重复消息' }] }, user: { id: 'demo:isolated-preview', name: 'Preview Owner' } }
const root = createRoot(document.getElementById('root'))
const render = async next => { props = { ...props, ...next }; await act(async () => root.render(createElement(AuditLog, props))) }
const rows = () => [...document.querySelectorAll('tbody > tr')]
const button = name => [...document.querySelectorAll('button')].find(el => el.textContent.trim() === name)
const click = async control => { assert.ok(control); await act(async () => control.click()) }
async function change(control, value) {
  await act(async () => {
    const prototype = control.tagName === 'INPUT' ? window.HTMLInputElement.prototype : window.HTMLSelectElement.prototype
    Object.getOwnPropertyDescriptor(prototype, 'value').set.call(control, value)
    control.dispatchEvent(new window.Event(control.tagName === 'INPUT' ? 'input' : 'change', { bubbles: true }))
  })
}
const search = () => document.querySelector('input[type=search]')
const action = () => document.querySelector('select')
const dates = () => [...document.querySelectorAll('input[type=date]')]
const clear = async () => click(button('清空记录筛选'))
try {
  await render()
  assert.deepEqual([...document.querySelectorAll('th')].map(el => el.textContent), ['时间', '操作者', '对象', '动作', '原因'])
  assert.equal(rows().length, 10)
  assert.match(document.body.textContent, /最多100条/); assert.match(document.body.textContent, /UTC\+8/)
  assert.match(rows()[0].children[0].textContent, /15:30:00/)
  assert.match(rows()[0].children[1].textContent, /moderator@example.test/)
  assert.match(rows()[0].children[2].textContent, /Bukit Impian Residence/)
  assert.match(rows()[1].children[1].textContent, /Preview Owner（当前账号）/)
  console.log('PASS: structured columns, newest-first sorting, Malaysia time, known labels and explicit loaded-record scope')

  await change(search(), '  BUKIT impian  '); assert.equal(rows().length, 1)
  await change(search(), 'unknown-actor-12345678901234567890'); assert.equal(rows().length, 1)
  assert.match(rows()[0].children[1].textContent, /账号 unknown/)
  assert.match(rows()[0].children[3].textContent, /其他操作（future_action）/)
  const raw = rows()[0].querySelector('details')
  await click(raw.querySelector('summary')); assert.ok(raw.open)
  assert.match(raw.textContent, /unknown-target-12345678901234567890/)
  await change(search(), 'audit-preview-07'); assert.match(rows()[0].children[1].textContent, /系统初始化/)
  await change(search(), 'audit-preview-08'); assert.match(rows()[0].children[1].textContent, /未记录操作者/)
  console.log('PASS: case-insensitive readable/raw-ID search, honest unknown identity/action and expandable original values')

  await clear(); await change(action(), 'review_location')
  assert.equal(rows().length, 1); assert.match(rows()[0].querySelector('.admin-audit-reason').textContent, /标记为需要复核/)
  await change(action(), 'set_role'); assert.match(rows()[0].querySelector('.admin-audit-reason').textContent, /目标角色：管理员/)
  await change(action(), 'resolve_report'); assert.match(rows()[0].querySelector('.admin-audit-reason').textContent, /处理结论：举报成立/); assert.match(rows()[0].querySelector('.admin-audit-reason').textContent, /隐藏选项：未勾选/)
  await change(search(), 'does not exist'); assert.equal(rows().length, 0)
  assert.match(document.body.textContent, /没有匹配的操作记录/)
  await clear(); assert.equal(rows().length, 10)
  console.log('PASS: action filtering, readable machine-generated reasons, combined no-match and clear')

  await change(dates()[0], '2026-11-03'); await change(dates()[1], '2026-11-03')
  assert.equal(rows().length, 8)
  assert.ok(rows().some(row => /00:15:00/.test(row.children[0].textContent)))
  await change(dates()[0], '2026-11-04'); assert.equal(rows().length, 0)
  assert.match(document.querySelector('[role=alert]').textContent, /开始日期不能晚于结束日期/)
  await clear(); await change(search(), 'invalid-time')
  assert.match(rows()[0].children[0].textContent, /时间未记录/)
  assert.match(rows()[0].children[3].textContent, /其他操作（constructor）/)
  console.log('PASS: inclusive local-date boundaries across UTC midnight, invalid ranges and malformed timestamps')

  await clear(); await click(button('下一页')); assert.equal(rows().length, 3); assert.ok(button('下一页').disabled)
  await change(search(), 'Sutera'); assert.match(document.querySelector('nav').textContent, /第 1 \/ 1 页/)
  await clear(); await click(button('下一页'))
  await render({ records: records.slice(0, 2) }); assert.equal(rows().length, 2)
  assert.match(document.querySelector('nav').textContent, /第 1 \/ 1 页/)
  await render({ records }); assert.equal(rows().length, 10)
  await change(search(), 'Bukit Impian'); await render({ records: [...records] }); assert.equal(search().value, 'Bukit Impian'); assert.equal(rows().length, 1)
  await render({ records: [] }); assert.match(document.body.textContent, /暂无操作记录/)
  assert.deepEqual(records, snapshot)
  console.log('PASS: pagination, reset/clamp after filtering or refresh, empty dataset and immutable source records')
} finally { await act(async () => root.unmount()); dom.window.close() }
