import assert from 'node:assert/strict'
import { JSDOM } from 'jsdom'

const dom = new JSDOM('<!doctype html><div id="root"></div>', { url: 'http://127.0.0.1:5186/' })
Object.assign(globalThis, {
  window: dom.window, document: dom.window.document,
  localStorage: dom.window.localStorage, FormData: dom.window.FormData,
  IS_REACT_ACT_ENVIRONMENT: true,
  requestAnimationFrame: callback => setTimeout(callback, 0),
})
globalThis.fetch = () => { throw new Error('Network access forbidden in navigation test') }
window.scrollTo = (x, y) => {
  Object.defineProperty(window, 'scrollX', { value: x, configurable: true })
  Object.defineProperty(window, 'scrollY', { value: y, configurable: true })
}
// This identity exists only inside this in-memory test DOM.
localStorage.setItem('masuk-user', JSON.stringify({ id: 'demo:navigation-qa', name: 'Navigation QA', role: 'admin' }))
const { createElement, act } = await import('react')
const { createRoot } = await import('react-dom/client')
const { default: App } = await import('./bundle/app.mjs')
const root = createRoot(document.getElementById('root'))
const button = text => [...document.querySelectorAll('button')].find(el => el.textContent.trim() === text)
const click = async el => { assert.ok(el, 'Control exists'); await act(async () => el.click()) }
const visibleAdmin = () => {
  const admin = document.querySelector('[aria-label="云端后台管理"]')
  return admin && !admin.closest('[hidden]') ? admin : null
}
try {
  await act(async () => root.render(createElement(App)))
  await click(button('后台管理'))
  const admin = visibleAdmin()
  assert.ok(admin)
  const filter = admin.querySelector('select')
  await act(async () => { filter.value = 'dismissed'; filter.dispatchEvent(new window.Event('change', { bubbles: true })) })
  const list = admin.querySelector('[aria-label="地点管理列表"]')
  const search = list.querySelector('input')
  await act(async () => {
    Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(search, 'Skudai')
    search.dispatchEvent(new window.Event('input', { bubbles: true }))
    const [area, status] = list.querySelectorAll('select')
    area.value = 'Skudai, Johor'; area.dispatchEvent(new window.Event('change', { bubbles: true }))
    status.value = 'normal'; status.dispatchEvent(new window.Event('change', { bubbles: true }))
  })
  for (const [targetPage, index, position] of [[1, 9, 1530], [2, 8, 2370]]) {
    if (targetPage === 2) await click([...admin.querySelectorAll('[aria-label="后台地点分页"] button')].find(el => el.textContent === '下一页'))
    const editButtons = [...admin.querySelectorAll('button')].filter(el => el.textContent === '修改资料')
    window.scrollTo(0, position)
    const trigger = editButtons[index]
    trigger.focus()
    await click(trigger)
    assert.equal(visibleAdmin(), null, 'Admin is hidden during edit')
    assert.equal(document.querySelector('[aria-label="云端后台管理"]'), admin, 'Admin stays mounted')
    assert.equal(window.scrollY, 0, 'Edit starts at top')
    assert.ok(button('取消修改'))
    assert.equal(admin.parentElement.hidden, true, 'Admin wrapper has native hidden state')
    await click(button('取消修改'))
    assert.equal(visibleAdmin(), admin, 'Cancel returns to same admin instance')
    assert.equal(filter.value, 'dismissed', 'Report filter retained')
    assert.equal(search.value, 'Skudai', 'Search retained')
    assert.equal(list.querySelectorAll('select')[0].value, 'Skudai, Johor', 'Area retained')
    assert.equal(list.querySelectorAll('select')[1].value, 'normal', 'Review status retained')
    assert.match(admin.querySelector('[aria-label="后台地点分页"]').textContent, new RegExp(`第 ${targetPage} /`), 'Admin page retained')
    assert.equal(window.scrollY, position, 'Original scroll restored')
    assert.equal(document.activeElement, trigger, 'Focus returns to original edit button')
    assert.equal(button('保存修改'), undefined, 'Edit form closed')
  }
  console.log('PASS: repeated admin edit/cancel preserves admin instance, report filter, scroll and focus')

  await click([...document.querySelectorAll('.topnav button')].find(el => el.textContent.includes('查地点')))
  window.scrollTo(0, 620)
  await click([...document.querySelectorAll('.location-card button')].find(el => el.textContent.trim() === '修改'))
  await click(button('取消修改'))
  assert.ok(document.querySelector('.location-card'), 'Browse-origin edit returns to browse')
  assert.equal(window.scrollY, 620)
  console.log('PASS: browse-origin cancel restores browse and its scroll position')

  await click(button('Bukit Impian Residence'))
  assert.ok(document.querySelector('.back-link'), 'Detail view opened')
  window.scrollTo(0, 350)
  const detailEdit = [...document.querySelectorAll('button')].find(el => /修改/.test(el.textContent) && !el.closest('.topnav'))
  await click(detailEdit)
  await click(button('取消修改'))
  assert.ok(document.querySelector('.back-link'), 'Detail-origin edit returns to same detail')
  assert.equal(window.scrollY, 350)
  console.log('PASS: detail-origin cancel restores detail and its scroll position')

  await click(button('后台管理'))
  await click([...visibleAdmin().querySelectorAll('button')].find(el => el.textContent === '修改资料'))
  await click(document.querySelector('.auth-button'))
  await click(button('取消修改'))
  assert.equal(visibleAdmin(), null, 'Signed-out user does not return to admin')
  assert.ok(document.querySelector('.location-card'), 'Safe fallback is browse')
  assert.equal(window.scrollY, 0)
  console.log('PASS: signing out during admin edit falls back to browse')
} finally {
  await act(async () => root.unmount())
  dom.window.close()
}
