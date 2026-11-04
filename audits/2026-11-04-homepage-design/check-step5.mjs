import { build } from 'vite'
import react from '@vitejs/plugin-react'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { JSDOM } from 'jsdom'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'

await build({
  configFile: false, envDir: false, plugins: [react()], mode: 'ui-test', logLevel: 'error',
  build: {
    outDir: fileURLToPath(new URL('./step5-render-bundle', import.meta.url)), emptyOutDir: false,
    lib: { entry: fileURLToPath(new URL('./step5-test-entry.mjs', import.meta.url)), formats: ['es'], fileName: () => 'component.mjs' },
    rollupOptions: { external: ['react', 'react/jsx-runtime', 'react/jsx-dev-runtime'] },
  },
})
const { CardEntrySummary, normalizeLocation } = await import('./step5-render-bundle/component.mjs')
const render = location => new JSDOM(renderToStaticMarkup(createElement(CardEntrySummary, { location }))).window.document
const missing = normalizeLocation({ id: 'fixture', name: 'Fixture', area: 'Skudai, Johor' })
for (const key of ['need_ic', 'need_qr', 'fee_required', 'bike_allowed']) assert.equal(missing.entry_requirements[key], '待确认')
assert.equal(render(missing).querySelectorAll('.entry-unknown').length, 4)
const no = normalizeLocation({ ...missing, entry_requirements: { need_ic: false, need_qr: false, fee_required: false, bike_allowed: false } })
assert.deepEqual([...render(no).querySelectorAll('dd')].map(e => e.textContent), ['不用', '不用', '不用', '不可以'])
const yes = render({ entry_requirements: { need_ic: true, need_qr: true, fee_required: true, bike_allowed: true } })
assert.deepEqual([...yes.querySelectorAll('dd')].map(e => e.textContent), ['需要', '需要', '需要', '可以'])
const imported = render({ last_modified_by: '公开资料导入', entry_requirements: { gate_rule: '24小时保安、车牌识别' } })
assert.equal(imported.querySelectorAll('.entry-known').length, 0)
assert.equal(imported.querySelector('details').hasAttribute('open'), false)
assert.match(imported.querySelector('summary').textContent, /公开项目资料/)
assert.match(imported.body.textContent, /不等于司机现场通关规则/)
const authored = render({ last_modified_by: 'Fixture', entry_requirements: { need_ic: true, gate_rule: '联系住户后登记', parking: '访客车位' } })
assert.equal(authored.querySelector('details'), null)
assert.match(authored.querySelector('.card-rule-notes').textContent, /规则说明.*联系住户后登记/)
assert.match(authored.querySelector('.card-parking-note').textContent, /访客车位/)
assert.equal(authored.querySelectorAll('.entry-unknown').length, 3)
console.log('PASS: 5 entry-summary and normalization cases; isolated props only, no cloud or storage writes')
