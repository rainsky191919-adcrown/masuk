import assert from 'node:assert/strict'
import { JSDOM } from 'jsdom'
const local = process.argv.includes('--local')
const dom = new JSDOM('<!doctype html><div id="root"></div>', { url: 'http://127.0.0.1:5186/' })
Object.assign(globalThis, { window: dom.window, document: dom.window.document, localStorage: dom.window.localStorage, FormData: dom.window.FormData, IS_REACT_ACT_ENVIRONMENT: true, requestAnimationFrame: fn => setTimeout(fn, 0) })
globalThis.fetch = () => { throw new Error('No network allowed in section navigation tests') }
window.scrollTo = () => {}
let scrolledTo = null
window.HTMLElement.prototype.scrollIntoView = function () { scrolledTo = this }
localStorage.setItem('masuk-user', JSON.stringify({ id: 'demo:sections-qa', name: 'Sections QA', role: 'admin' }))
const { createElement, act } = await import('react')
const { createRoot } = await import('react-dom/client')
const { default: App } = await import(local ? './bundle-local/app.mjs' : './bundle/app.mjs')
const root = createRoot(document.getElementById('root'))
const button = text => [...document.querySelectorAll('button')].find(el => el.textContent.trim() === text)
const click = async control => { assert.ok(control); await act(async () => control.click()) }
const navButtons = () => [...document.querySelectorAll('[aria-label="后台模块直达"] button')]
async function change(control, value) {
  await act(async () => {
    const prototype = control.tagName === 'INPUT' ? window.HTMLInputElement.prototype : window.HTMLSelectElement.prototype
    Object.getOwnPropertyDescriptor(prototype, 'value').set.call(control, value)
    control.dispatchEvent(new window.Event(control.tagName === 'INPUT' ? 'input' : 'change', { bubbles: true }))
  })
}
try {
  await act(async () => root.render(createElement(App)))
  await click(button('后台管理'))
  const admin = document.querySelector('.admin-layout')
  assert.equal(navButtons().length, local ? 2 : 5)
  for (const control of navButtons()) {
    const target = document.getElementById(control.getAttribute('aria-controls'))
    assert.ok(target)
    await click(control)
    assert.equal(document.activeElement, target)
    assert.equal(scrolledTo, target)
    assert.equal(document.querySelector('.admin-layout'), admin)
    assert.equal(window.location.hash, '')
  }
  console.log('PASS: ' + (local ? 'local' : 'cloud') + ' section buttons target real headings, move focus and keep history unchanged')

  const search = document.querySelector('.admin-location-toolbar input')
  await change(search, 'Skudai')
  await change(document.querySelector('.admin-location-toolbar select'), 'Skudai, Johor')
  await change(document.querySelectorAll('.admin-location-toolbar select')[1], 'normal')
  await click([...document.querySelectorAll('.admin-location-pagination button')].find(el => el.textContent === '下一页'))
  let account = null
  if (!local) {
    account = document.getElementById('admin-accounts').parentElement
    await change(account.querySelector('[name=email]'), 'section-test@example.test')
    await change(account.querySelector('[name=reason]'), 'Local unsaved fixture draft')
  }
  for (const control of navButtons()) await click(control)
  assert.equal(search.value, 'Skudai')
  assert.equal(document.querySelector('.admin-location-toolbar select').value, 'Skudai, Johor')
  assert.equal(document.querySelectorAll('.admin-location-toolbar select')[1].value, 'normal')
  assert.match(document.querySelector('.admin-location-pagination').textContent, /第 2 \/ 3 页/)
  if (account) {
    assert.equal(account.querySelector('[name=email]').value, 'section-test@example.test')
    assert.equal(account.querySelector('[name=reason]').value, 'Local unsaved fixture draft')
  }
  console.log('PASS: ' + (local ? 'local' : 'cloud') + ' jumps preserve query, area, review status, page and unsaved account draft where available')
} finally {
  await act(async () => root.unmount())
}

if (!local) {
  const { default: CloudAdmin } = await import('./bundle-sections/admin.mjs')
  const roleRoot = createRoot(document.getElementById('root'))
  const renderRole = role => act(async () => roleRoot.render(createElement(CloudAdmin, { user: { id: 'role-fixture', name: 'Role fixture', role }, locations: [], onEdit() {}, onChanged() {}, showToast() {} })))
  try {
    await renderRole('admin')
    assert.equal(navButtons().length, 4)
    assert.equal(document.getElementById('admin-accounts'), null)
    assert.ok(!navButtons().some(el => el.getAttribute('aria-controls') === 'admin-accounts'))
    await renderRole('super_admin')
    assert.equal(navButtons().length, 5)
    assert.ok(document.getElementById('admin-accounts'))
    await renderRole('user')
    assert.equal(navButtons().length, 0)
    console.log('PASS: navigation visibility follows existing admin/super-admin/user UI roles without adding access')
  } finally {
    await act(async () => roleRoot.unmount())
  }
}
dom.window.close()
