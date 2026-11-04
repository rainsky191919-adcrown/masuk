import { build } from 'vite'
import react from '@vitejs/plugin-react'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { JSDOM } from 'jsdom'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'

// Isolated component props; no browser storage or cloud writes.
await build({
  configFile: false, envDir: false, plugins: [react()],
  mode: 'ui-test', logLevel: 'error',
  build: {
    outDir: fileURLToPath(new URL('./step2-render-bundle', import.meta.url)),
    emptyOutDir: false,
    lib: { entry: fileURLToPath(new URL('../../src/components/LocationDetail.jsx', import.meta.url)), formats: ['es'], fileName: () => 'component.mjs' },
    rollupOptions: { external: ['react', 'react/jsx-runtime', 'react/jsx-dev-runtime'] },
  },
})
const { Friendliness } = await import('./step2-render-bundle/component.mjs')
const location = { id: 'isolated-rating-fixture' }
const rows = levels => levels.map((level, i) => ({ locationId: location.id, authorId: `fixture-${i}`, level, visitedAt: new Date(Date.now() - 86400000).toISOString() }))
const render = (feedback, compact = true) => new JSDOM(renderToStaticMarkup(createElement(Friendliness, { location, feedback, compact }))).window.document
const empty = render([])
assert.match(empty.body.textContent, /尚无司机评分/)
assert.match(empty.body.textContent, /暂无近期到访反馈/)
assert.equal(empty.querySelector('.rating-scale'), null)
assert.ok(empty.querySelector('.rating-0'))
const insufficient = render(rows([1, 1]))
assert.match(insufficient.body.textContent, /反馈不足，暂未评分/)
assert.match(insufficient.body.textContent, /满3位后形成评分/)
assert.equal(insufficient.querySelector('.rating-scale'), null)
const rated = render(rows([2, 2, 2]))
assert.equal(rated.querySelector('strong').textContent, '较顺畅')
assert.match(rated.body.textContent, /最近到访反馈：/)
assert.ok(rated.querySelector('.status-dot.rating-2'))
assert.equal(rated.querySelector('.rating-scale'), null)
const stale = render(rows([2, 2, 2]).map(row => ({ ...row, visitedAt: new Date(Date.now() - 90 * 86400000).toISOString() })))
assert.match(stale.body.textContent, /尚无司机评分/)
const disputed = render(rows([1, 3, 5]))
assert.match(disputed.querySelector('.dispute').textContent, /体验有分歧/)
const detail = render(rows([2, 2, 2]), false)
assert.equal(detail.querySelectorAll('.rating-scale > div').length, 5)
assert.equal(detail.querySelector('.rating-selected').textContent, '较顺畅')
console.log('PASS: 6 render cases (empty, insufficient, rated, stale, disputed, detail unchanged); no persistence or cloud writes')
