import assert from 'node:assert/strict'
import { JSDOM } from 'jsdom'
const dom = new JSDOM('<!doctype html><div id="root"></div>', { url: 'http://127.0.0.1:5186/' })
Object.assign(globalThis, { window: dom.window, document: dom.window.document, IS_REACT_ACT_ENVIRONMENT: true })
globalThis.fetch = () => { throw new Error('No network allowed in account UI tests') }
window.HTMLElement.prototype.scrollIntoView = function () {}
const { createElement, act } = await import('react')
const { createRoot } = await import('react-dom/client')
const { default: Accounts } = await import('./bundle-accounts/accounts.mjs')
const root = createRoot(document.getElementById('root'))
const roles = [{ user_id: 'owner', email: 'owner@example.test', role: 'super_admin' }, { user_id: 'moderator', email: 'mod@example.test', role: 'admin' }, { user_id: 'backup', email: 'backup@example.test', role: 'super_admin' }]
let key = 0, props, calls = []
const defaultSave = async payload => { calls.push(payload); return { ok: true } }
async function mount(overrides = {}) { key++; calls = []; props = { roles, user: { id: 'owner' }, busy: false, onSave: defaultSave, ...overrides }; await update() }
async function update(overrides = {}) { props = { ...props, ...overrides }; await act(async () => root.render(createElement(Accounts, { ...props, key }))) }
const button = text => [...document.querySelectorAll('button')].find(el => el.textContent.trim() === text)
const input = name => document.querySelector(`[name="${name}"]`)
const summary = () => document.querySelector('[aria-label="权限调整确认摘要"]')
const click = async control => { assert.ok(control); await act(async () => control.click()) }
async function change(name, value) {
  await act(async () => {
    const control = input(name)
    const prototype = control.tagName === 'SELECT' ? window.HTMLSelectElement.prototype : window.HTMLInputElement.prototype
    Object.getOwnPropertyDescriptor(prototype, 'value').set.call(control, value)
    control.dispatchEvent(new window.Event(control.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }))
  })
}
async function draft(email = 'mod@example.test', role = 'user') { await change('email', email); await change('role', role); await change('reason', '  Local role review fixture  '); await click(button('核对权限调整')) }
try {
  await mount()
  await click([...document.querySelectorAll('button')].find(el => el.getAttribute('aria-label') === '选择账号 mod@example.test'))
  assert.equal(input('email').value, 'mod@example.test'); assert.equal(input('role').value, 'admin')
  assert.ok(button('核对权限调整').disabled)
  await change('role', 'user'); await change('reason', 'Local reason')
  await click(button('核对权限调整'))
  assert.equal(calls.length, 0)
  assert.ok(summary()); assert.equal(document.activeElement, summary())
  assert.match(summary().textContent, /mod@example.test/); assert.match(summary().textContent, /普通用户/)
  await click(button('返回修改'))
  assert.equal(summary(), null); assert.equal(input('reason').value, 'Local reason'); assert.equal(document.activeElement, input('email'))
  console.log('PASS: existing role selection, unchanged role guard, preview-only summary and return-to-edit with retained draft')

  for (const [name, value] of [['email', 'other@example.test'], ['role', 'super_admin'], ['reason', 'Different reason']]) {
    await mount(); await draft(); assert.ok(summary()); await change(name, value)
    assert.equal(summary(), null); assert.equal(calls.length, 0)
  }
  await mount(); await draft('new@example.test', 'admin')
  assert.match(summary().textContent, /验证状态待确认/)
  assert.equal(calls.length, 0)
  console.log('PASS: all draft edits invalidate confirmation; unlisted email is not represented as a verified ordinary user')

  let resolveSave
  await mount({ onSave: payload => { calls.push(payload); return new Promise(resolve => { resolveSave = resolve }) } })
  await draft('  MOD@example.test  ', 'user')
  const submit = button('确认提交权限调整')
  await act(async () => { submit.click(); submit.click() })
  assert.equal(calls.length, 1)
  assert.deepEqual(calls[0], { email: 'mod@example.test', role: 'user', reason: 'Local role review fixture' })
  assert.ok(button('正在提交…').disabled)
  await act(async () => resolveSave({ ok: true }))
  assert.equal(summary(), null); assert.equal(input('reason').value, '')
  console.log('PASS: final confirmation sends only normalized reviewed payload, prevents duplicate submits and reports success')

  await mount({ roles: roles.slice(0, 2) }); await draft('owner@example.test', 'admin')
  assert.ok(button('核对权限调整').disabled); assert.equal(summary(), null); assert.match(document.body.textContent, /必须保留至少一位/)
  await mount(); await draft('owner@example.test', 'admin')
  assert.match(summary().textContent, /这是你正在使用的账号/); assert.equal(calls.length, 0)
  console.log('PASS: last-super-admin constraint and self-change impact are shown without granting or changing access')

  await mount({ onSave: async payload => { calls.push(payload); return { ok: false, error: 'Fixture account not verified' } } })
  await draft('unverified@example.test', 'admin'); await click(button('确认提交权限调整'))
  assert.equal(calls.length, 1); assert.ok(summary()); assert.equal(input('reason').value.trim(), 'Local role review fixture')
  assert.match(document.querySelector('[role=alert]').textContent, /not verified/)
  console.log('PASS: rejected request retains summary and draft, exposes recoverable error')

  await mount(); await draft('mod@example.test', 'super_admin')
  await update({ roles: roles.filter(item => item.user_id !== 'moderator') })
  assert.equal(summary(), null); assert.equal(calls.length, 0); assert.match(document.body.textContent, /资料已刷新/)
  await update({ busy: true }); assert.ok(input('email').disabled); assert.ok(button('核对权限调整').disabled)
  console.log('PASS: refreshed role data invalidates old summary and busy state prevents edits/submission')

  await mount({ onSave: async () => { throw new Error('Fixture uncertain response') } })
  await draft(); await click(button('确认提交权限调整'))
  assert.ok(summary()); assert.match(document.querySelector('[role=alert]').textContent, /结果尚未确认/)
  console.log('PASS: uncertain request outcome is not reported as definitely unsaved')
} finally { await act(async () => root.unmount()); dom.window.close() }
