import assert from 'node:assert/strict'
import { JSDOM } from 'jsdom'

const local = process.argv.includes('--local')
const dom = new JSDOM('<!doctype html><div id="root"></div>', { url: 'http://127.0.0.1:5186/' })
Object.assign(globalThis, {
  window: dom.window, document: dom.window.document,
  localStorage: dom.window.localStorage, FormData: dom.window.FormData,
  IS_REACT_ACT_ENVIRONMENT: true,
  requestAnimationFrame: callback => setTimeout(callback, 0),
})
globalThis.fetch = () => { throw new Error('Network access forbidden in copy verification') }
window.scrollTo = () => {}
localStorage.setItem('masuk-user', JSON.stringify({ id: 'demo:copy-qa', name: 'Copy QA', role: 'admin' }))
const { createElement, act } = await import('react')
const { createRoot } = await import('react-dom/client')
const { default: App } = await import(local ? './bundle-local/app.mjs' : './bundle/app.mjs')
const root = createRoot(document.getElementById('root'))
const button = text => [...document.querySelectorAll('button')].find(el => el.textContent.trim() === text)
const click = async el => { assert.ok(el, 'Control exists'); await act(async () => el.click()) }
function checkScope(editing) {
  const notice = document.querySelector('.form-footnote').textContent
  if (local) {
    assert.match(notice, /本机保存/)
    assert.match(notice, /不会同步到其他设备或上传云端/)
    assert.doesNotMatch(notice, /云端共享|由服务端留存/)
  } else {
    assert.match(notice, /云端共享/)
    assert.match(notice, /保存成功后/)
    assert.match(notice, /其他设备可/)
    assert.doesNotMatch(notice, /仅保存在此浏览器|尚未跨设备共享/)
    if (editing) assert.match(notice, /修改者、修改原因和版本历史由服务端留存/)
  }
  assert.doesNotMatch(document.querySelector('.contribute-note').textContent, /先标为|司机补充/)
}
try {
  await act(async () => root.render(createElement(App)))
  await click(button('报一个新点'))
  checkScope(false)
  assert.ok(button('发布这条现场情报'))
  assert.doesNotMatch(document.querySelector('.contribute-layout').textContent, /管理员编辑/)
  assert.ok(document.querySelector('.hero-section'))
  console.log('PASS: ' + (local ? 'local' : 'cloud') + ' creation states actual save scope without a pending-review claim')

  await click([...document.querySelectorAll('.topnav button')].find(el => el.textContent.includes('查地点')))
  await click([...document.querySelectorAll('.location-card button')].find(el => el.textContent.trim() === '修改'))
  checkScope(true)
  assert.match(document.querySelector('.contribute-note').textContent, /生成新版本/)
  assert.doesNotMatch(document.querySelector('.contribute-layout').textContent, /管理员编辑/)
  await click(button('取消修改'))
  console.log('PASS: ' + (local ? 'local' : 'cloud') + ' public edit has version and save-scope explanations')

  await click(button('后台管理'))
  if (!local) assert.match(document.querySelector('[aria-label="云端后台管理"] .community-notice').textContent, /云端管理.*保存成功后.*当前站点/)
  await click([...document.querySelectorAll('.admin-row button')].find(el => el.textContent.trim() === '修改资料'))
  checkScope(true)
  assert.match(document.querySelector('.contribute-layout').textContent, /管理员编辑地点/)
  assert.match(document.querySelector('.contribute-intro p').textContent, /Bukit Impian Residence/)
  assert.equal(document.querySelector('.topnav .nav-item-active').textContent.trim(), '后台管理')
  assert.ok(document.querySelector('[name="change_reason"]').required)
  assert.ok(button('保存修改'))
  assert.equal(document.querySelector('.hero-section'), null)
  assert.equal([...document.querySelectorAll('h1')].filter(el => !el.closest('[hidden]')).length, 1)
  assert.equal(document.querySelector('.admin-edit-context h1').textContent, 'Bukit Impian Residence')
  assert.match(document.querySelector('.admin-edit-context p').textContent, /当前版本 1/)
  assert.ok(document.querySelector('[aria-label="后台编辑路径"] [aria-current="page"]'))
  await click(button('后台 / 地点管理'))
  assert.ok(document.querySelector('.admin-layout'))
  console.log('PASS: ' + (local ? 'local' : 'cloud') + ' admin edit identifies target and role, keeps admin navigation and required reason')
} finally {
  await act(async () => root.unmount())
  dom.window.close()
}
