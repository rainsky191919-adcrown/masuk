import assert from 'node:assert/strict'
import { JSDOM } from 'jsdom'
const dom = new JSDOM('<!doctype html><div id="root"></div>', { url: 'http://127.0.0.1:5186/' })
Object.assign(globalThis, { window: dom.window, document: dom.window.document, IS_REACT_ACT_ENVIRONMENT: true })
const { createElement, act } = await import('react')
const { createRoot } = await import('react-dom/client')
const { default: AdminLocationList } = await import('./bundle-list/list.mjs')
const original = Array.from({ length: 27 }, (_, index) => ({
  id: String(index), name: `Residence ${String(index + 1).padStart(2, '0')}`,
  area: index % 2 ? 'Johor' : 'Skudai', address: index === 22 ? 'Special Entrance West' : `Road ${index + 1}`,
  review_needed: index % 3 === 0,
}))
const snapshot = structuredClone(original)
let rows = original
const root = createRoot(document.getElementById('root'))
const render = async () => { await act(async () => root.render(createElement(AdminLocationList, {
  locations: rows,
  renderRow: row => createElement('div', { className: 'admin-row', key: row.id }, row.name),
}))) }
const next = () => [...document.querySelectorAll('button')].find(el => el.textContent === '下一页')
const previous = () => [...document.querySelectorAll('button')].find(el => el.textContent === '上一页')
const query = () => document.querySelector('input[type=search]')
const selects = () => [...document.querySelectorAll('select')]
const rowNames = () => [...document.querySelectorAll('.admin-row')].map(el => el.textContent)
const summary = () => document.querySelector('[role=status]').textContent
const click = async control => { assert.ok(control); await act(async () => control.click()) }
async function change(control, value) {
  await act(async () => {
    const prototype = control.tagName === 'INPUT' ? window.HTMLInputElement.prototype : window.HTMLSelectElement.prototype
    Object.getOwnPropertyDescriptor(prototype, 'value').set.call(control, value)
    control.dispatchEvent(new window.Event(control.tagName === 'INPUT' ? 'input' : 'change', { bubbles: true }))
  })
}
const clear = async () => click([...document.querySelectorAll('button')].find(el => el.textContent === '清空地点筛选'))
try {
  await render()
  assert.equal(rowNames().length, 10)
  assert.ok(previous().disabled)
  await click(next()); assert.equal(rowNames()[0], 'Residence 11')
  await click(next()); assert.equal(rowNames().length, 7); assert.ok(next().disabled)
  await click(previous()); assert.equal(rowNames()[0], 'Residence 11')
  console.log('PASS: 27 records paginate 10/10/7 with correct bounds and previous page')

  await change(query(), '  SPECIAL entrance  ')
  assert.deepEqual(rowNames(), ['Residence 23'])
  assert.match(document.querySelector('nav').textContent, /第 1 \/ 1 页/)
  await change(query(), 'residence 02'); assert.deepEqual(rowNames(), ['Residence 02'])
  await change(query(), 'joHoR'); assert.match(summary(), /匹配 13/)
  console.log('PASS: search matches name, area and address, ignores case/outer whitespace and resets page')

  await clear()
  await change(selects()[0], 'Skudai')
  await change(selects()[1], 'review')
  assert.deepEqual(rowNames(), ['Residence 01', 'Residence 07', 'Residence 13', 'Residence 19', 'Residence 25'])
  await change(query(), '13'); assert.deepEqual(rowNames(), ['Residence 13'])
  await change(selects()[1], 'normal'); assert.equal(rowNames().length, 0)
  assert.match(document.body.textContent, /没有匹配的地点/)
  assert.ok(next().disabled && previous().disabled)
  await clear(); assert.equal(rowNames().length, 10); assert.equal(query().value, '')
  assert.equal(selects()[0].value, ''); assert.equal(selects()[1].value, 'all')
  console.log('PASS: combined area/status/search filtering, empty state and reset')

  await click(next()); await click(next())
  rows = original.slice(0, 4); await render()
  assert.equal(rowNames().length, 4)
  assert.match(document.querySelector('nav').textContent, /第 1 \/ 1 页/)
  rows = original; await render(); assert.equal(rowNames()[0], 'Residence 01')
  await change(selects()[0], 'Johor')
  rows = original.filter(row => row.area === 'Skudai'); await render()
  assert.equal(selects()[0].value, 'Johor')
  assert.equal(rowNames().length, 0)
  await clear(); assert.equal(rowNames().length, 10)
  rows = []; await render(); assert.match(document.body.textContent, /暂无地点资料/)
  assert.equal(rowNames().length, 0)
  assert.deepEqual(original, snapshot)
  console.log('PASS: live data shrink clamps pages, removed areas remain explainable, empty dataset and no input mutation')
} finally {
  await act(async () => root.unmount())
  dom.window.close()
}
