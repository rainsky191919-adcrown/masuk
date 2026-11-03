export const environments = {
  qa: { project: 'meqmyxaxnpntjlerrxcb', worker: 'masuk', origin: 'https://masuk.pintumasuk.workers.dev' },
  production: { project: 'mlpfzynzawzhrowfkqtr', worker: 'my', origin: 'https://my.pintumasuk.workers.dev' },
}
const allowed = new Set(['VITE_SUPABASE_URL', 'VITE_SUPABASE_PUBLISHABLE_KEY', 'VITE_SUPABASE_ANON_KEY', 'VITE_SHARED_BACKEND', 'VITE_GEOCODER_URL', 'VITE_MAP_TILE_URL'])
export function validateBuildEnvironment(mode, env) {
  const target = environments[mode]
  if (!target) throw new Error('Release builds require an explicit qa or production target')
  if (env.VITE_SUPABASE_URL !== `https://${target.project}.supabase.co`) throw new Error(`${mode}: backend project does not match the approved target`)
  if (env.VITE_SHARED_BACKEND !== 'true') throw new Error(`${mode}: shared backend must be enabled`)
  if (!/^sb_publishable_[A-Za-z0-9_-]+$/.test(env.VITE_SUPABASE_PUBLISHABLE_KEY || '')) throw new Error(`${mode}: a public publishable client key is required`)
  if (env.VITE_SUPABASE_ANON_KEY) throw new Error(`${mode}: remove the redundant legacy client key`)
  if (Object.keys(env).some(name => name.startsWith('VITE_') && !allowed.has(name))) throw new Error(`${mode}: unexpected client-exposed configuration`)
  return { ...target, target: mode, shared_backend: true }
}
