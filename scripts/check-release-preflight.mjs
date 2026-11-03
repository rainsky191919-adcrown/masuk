import fs from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { loadEnv } from 'vite'
import { environments, validateBuildEnvironment } from '../config/environments.mjs'
const root = process.cwd()
const mode = process.argv[2] || 'production'
const target = environments[mode]
if (!target) throw new Error('Choose qa or production')
const hash = value => crypto.createHash('sha256').update(value).digest('hex')
async function files(dir) {
  const result = []
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name)
    if (entry.isDirectory()) result.push(...await files(file))
    else result.push(file)
  }
  return result.sort()
}
const env = loadEnv(mode, root, 'VITE_')
let validationError = null
try { validateBuildEnvironment(mode, env) } catch (error) { validationError = error.message }
const key = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY || ''
let keyType = key.startsWith('sb_publishable_') ? 'publishable' : 'unrecognized-or-missing'
if (key.split('.').length === 3) {
  try { keyType = JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString()).role === 'anon' ? 'legacy-anon' : 'non-public-role' } catch {}
}
const envChecks = {
  shared_backend_enabled: env.VITE_SHARED_BACKEND === 'true',
  target: mode,
  project: target.project,
  project_matches: env.VITE_SUPABASE_URL === `https://${target.project}.supabase.co`,
  client_key_is_public: ['publishable', 'legacy-anon'].includes(keyType),
  public_key_type: keyType,
  unexpected_exposed_variable_names: Object.keys(env).filter(name => !['VITE_SHARED_BACKEND', 'VITE_SUPABASE_URL', 'VITE_SUPABASE_PUBLISHABLE_KEY', 'VITE_SUPABASE_ANON_KEY', 'VITE_GEOCODER_URL', 'VITE_MAP_TILE_URL'].includes(name)),
  local_qa_env_file_present: await fs.access('.env.qa').then(() => true, () => false),
  validation_error: validationError,
}
const sourcePaths = [...await files(path.join(root, 'src')), ...await files(path.join(root, 'config')), ...['index.html', 'package.json', 'package-lock.json', 'vite.config.js', 'scripts/check-release-preflight.mjs'].map(name => path.join(root, name))].sort()
const source = await Promise.all(sourcePaths.map(async file => ({ path: path.relative(root, file).replaceAll('\\', '/'), sha256: hash(await fs.readFile(file)) })))
const assets = await Promise.all((await files(path.join(root, 'dist', mode))).map(async file => ({ path: path.relative(root, file).replaceAll('\\', '/'), sha256: hash(await fs.readFile(file)), bytes: (await fs.stat(file)).size })))
const info = JSON.parse(await fs.readFile(path.join(root, 'dist', mode, 'build-info.json'), 'utf8'))
const js = (await Promise.all(assets.filter(item => item.path.endsWith('.js')).map(item => fs.readFile(item.path, 'utf8')))).join('\n')
const bundleChecks = {
  contains_production_project: js.includes('mlpfzynzawzhrowfkqtr.supabase.co'),
  contains_qa_project: js.includes('meqmyxaxnpntjlerrxcb.supabase.co'),
  build_info_matches: info.target === mode && info.project === target.project && info.worker === target.worker && info.shared_backend === true && info.origin === target.origin,
  contains_preview_fixture: ['demo:isolated-preview', 'Navigation fixture rejects all writes', 'LOCAL ONLY · Edit return verification'].some(value => js.includes(value)),
  contains_recognizable_secret_prefix: /sb_secret_[a-zA-Z0-9_-]{10,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(js),
  contains_new_admin_copy: js.includes('讨论内容管理') && js.includes('当前没有待处理举报') && js.includes('上次成功载入') && js.includes('后台编辑路径'),
}
const result = { checked_at: new Date().toISOString(), status: 'configuration_verified_candidate_not_frozen_or_deployed', base_head: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), source_tree_sha256: hash(source.map(item => `${item.path}\0${item.sha256}`).join('\n')), environment: envChecks, bundle_checks: bundleChecks, build_info: info, source, assets }
const checksPass = !validationError && envChecks.shared_backend_enabled && envChecks.project_matches && envChecks.client_key_is_public && !envChecks.unexpected_exposed_variable_names.length && (mode === 'production' ? bundleChecks.contains_production_project && !bundleChecks.contains_qa_project : bundleChecks.contains_qa_project && !bundleChecks.contains_production_project) && bundleChecks.build_info_matches && info.source_sha === result.base_head && !bundleChecks.contains_preview_fixture && !bundleChecks.contains_recognizable_secret_prefix && bundleChecks.contains_new_admin_copy
if (!checksPass) result.status = 'not_release_ready_configuration_mismatch'
await fs.mkdir('audits/admin-2026-11-03', { recursive: true })
await fs.writeFile(`audits/admin-2026-11-03/PREFLIGHT-${mode}.json`, JSON.stringify(result, null, 2) + '\n')
console.log(JSON.stringify({ environment: envChecks, bundle_checks: bundleChecks, source_tree_sha256: result.source_tree_sha256, assets }, null, 2))
if (!checksPass) process.exitCode = 1
