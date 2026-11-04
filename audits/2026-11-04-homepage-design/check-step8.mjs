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
    outDir: fileURLToPath(new URL('./step8-render-bundle', import.meta.url)), emptyOutDir: false,
    lib: { entry: fileURLToPath(new URL('../../src/components/BoardStatus.jsx', import.meta.url)), formats: ['es'], fileName: () => 'component.mjs' },
    rollupOptions: { external: ['react', 'react/jsx-runtime', 'react/jsx-dev-runtime'] },
  },
})
const { default: BoardStatus, getBoardStatus } = await import('./step8-render-bundle/component.mjs')
const now = Date.parse('2026-11-04T00:00:00Z')
const base = { locations: [{ id: 'a' }, { id: 'b' }], feedback: [], isLoading: false, dataSource: 'mock', hasCloudConfig: false, shared: false, now }
const cases = [
  ['loading', { isLoading: true }, /资料加载中/, /正在获取/, false],
  ['connecting', { dataSource: 'connecting' }, /资料加载中/, /正在获取/, false],
  ['local', {}, /2 个地点/, /本机资料.*近30天暂无反馈/, false],
  ['shared', { dataSource: 'supabase', shared: true }, /2 个地点/, /共享资料.*近30天暂无反馈/, false],
  ['local-feedback', { dataSource: 'supabase' }, /2 个地点/, /反馈仅本机/, false],
  ['failure-empty', { dataSource: 'error', locations: [] }, /资料暂不可用/, /加载失败/, true],
  ['failure-retained', { dataSource: 'error' }, /2 个地点/, /显示上次资料/, true],
  ['fallback', { hasCloudConfig: true }, /2 个地点/, /云端未连接.*本机资料/, true],
  ['loaded-empty', { locations: [] }, /0 个地点/, /近30天暂无反馈/, false],
]
for (const [name, overrides, headline, note, warning] of cases) {
  const props = { ...base, ...overrides }
  const result = getBoardStatus(props)
  assert.match(result.headline, headline, name)
  assert.match(result.note, note, name)
  assert.equal(result.warning, warning, name)
  const document = new JSDOM(renderToStaticMarkup(createElement(BoardStatus, props))).window.document
  assert.ok(document.querySelector('[role="status"][aria-atomic="true"]'), name)
  assert.match(document.body.textContent, /覆盖 Skudai, Johor/, name)
  assert.doesNotMatch(document.body.textContent, /Supabase|FIELD BOARD|实时同步|已验证/, name)
}
const row = (locationId, visitedAt) => ({ locationId, visitedAt, level: 1 })
const recent = new Date(now - 86400000).toISOString()
const feedback = [row('a', recent), row('a', recent), row('b', '2026-08-01T00:00:00Z'), row('b', '2026-12-01T00:00:00Z'), row('other', recent)]
assert.match(getBoardStatus({ ...base, dataSource: 'supabase', shared: true, feedback }).note, /近30天 1 个地点有反馈/)
console.log('PASS: 10 board-status cases; loading, scope, failures, fallback, empty and recent-location counts; no cloud or storage writes')
