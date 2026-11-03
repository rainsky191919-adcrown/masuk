import assert from 'node:assert/strict'
import { JSDOM } from 'jsdom'
const dom = new JSDOM('<!doctype html><div id="root"></div>', { url: 'http://127.0.0.1:5186/' })
Object.assign(globalThis, { window: dom.window, document: dom.window.document, localStorage: dom.window.localStorage, FormData: dom.window.FormData, IS_REACT_ACT_ENVIRONMENT: true, requestAnimationFrame: fn => setTimeout(fn, 0) })
globalThis.fetch = () => { throw new Error('No network allowed in location action tests') }
window.scrollTo = () => {}
const { createElement, act } = await import('react')
const { createRoot } = await import('react-dom/client')
const { default: Actions } = await import('./bundle-actions/actions.mjs')
const rows = [{ id: 'one', name: 'Bukit Impian Residence' }, { id: 'two', name: 'A long residence name with several words and punctuation @ Skudai' }]
let reviewed = false, disabled = false, local = false, edits = [], reviews = [], deletions = []
let root = createRoot(document.getElementById('root'))
const render = async () => act(async () => root.render(createElement('div', null, rows.map(location => createElement(Actions, {
  key: location.id, location, reviewNeeded: reviewed, disabled,
  onEdit: value => edits.push(value.id), onToggleReview: value => reviews.push(value.id),
  onDelete: local ? value => deletions.push(value.id) : undefined,
})))))
const click = async control => { assert.ok(control); await act(async () => control.click()) }
const byName = name => [...document.querySelectorAll('button')].find(el => el.getAttribute('aria-label') === name)
try {
  await render()
  const names = [...document.querySelectorAll('button')].map(el => el.getAttribute('aria-label'))
  assert.equal(new Set(names).size, 4)
  for (const location of rows) {
    const edit = byName(`修改资料：${location.name}`)
    assert.ok(edit); assert.equal(edit.textContent, '修改资料'); assert.match(edit.title, new RegExp(location.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
    assert.ok(document.querySelector(`[aria-label="地点操作：${location.name}"]`))
  }
  await click(byName(`修改资料：${rows[1].name}`))
  assert.deepEqual(edits, ['two']); assert.equal(reviews.length, 0)
  console.log('PASS: unique accessible names include each target, visible labels match and editing affects only the selected location')

  const mark = byName(`标记复核：${rows[0].name}`)
  assert.equal(mark.getAttribute('aria-pressed'), 'false')
  await click(mark); assert.deepEqual(reviews, ['one'])
  reviewed = true; await render()
  assert.equal(byName(`取消复核：${rows[0].name}`).getAttribute('aria-pressed'), 'true')
  await click(byName(`取消复核：${rows[1].name}`)); assert.deepEqual(reviews, ['one', 'two'])
  assert.equal(deletions.length, 0); assert.equal(document.querySelector('.admin-location-delete'), null)
  console.log('PASS: review action names and pressed state reflect the current flag; cloud actions do not expose deletion')

  local = true; disabled = true; await render()
  const counts = [edits.length, reviews.length, deletions.length]
  for (const control of document.querySelectorAll('button')) { assert.ok(control.disabled); await click(control) }
  assert.deepEqual([edits.length, reviews.length, deletions.length], counts)
  disabled = false; await render(); await click(byName(`删除地点：${rows[1].name}`))
  assert.deepEqual(deletions, ['two'])
  console.log('PASS: busy state disables every action and optional local delete callback retains its exact target')
  await act(async () => root.unmount())

  localStorage.setItem('masuk-user', JSON.stringify({ id: 'demo:actions-qa', name: 'Actions QA', role: 'admin' }))
  const { default: App } = await import('./bundle-local/app.mjs')
  root = createRoot(document.getElementById('root'))
  await act(async () => root.render(createElement(App)))
  await click([...document.querySelectorAll('button')].find(el => el.textContent.trim() === '后台管理'))
  await click(byName('标记复核：Bukit Impian Residence'))
  assert.ok(byName('取消复核：Bukit Impian Residence'))
  await act(async () => {
    const status = document.querySelectorAll('.admin-location-toolbar select')[1]
    status.value = 'review'; status.dispatchEvent(new window.Event('change', { bubbles: true }))
  })
  assert.equal(document.querySelectorAll('.admin-row').length, 1)
  await click(byName('取消复核：Bukit Impian Residence'))
  assert.equal(document.querySelectorAll('.admin-row').length, 0)
  assert.match(document.querySelector('.admin-location-summary').textContent, /匹配 0/)
  console.log('PASS: local App marking/cancelling review updates the existing review filter without changing any cloud data')
} finally { await act(async () => root.unmount()); dom.window.close() }
