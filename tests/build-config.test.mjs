import assert from 'node:assert/strict'
import test from 'node:test'
import { environments, validateBuildEnvironment } from '../config/environments.mjs'
const envFor = mode => ({ VITE_SUPABASE_URL: `https://${environments[mode].project}.supabase.co`, VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_fixture_only_not_a_real_key', VITE_SHARED_BACKEND: 'true' })
test('each build target has its own project, worker and origin', () => {
  for (const mode of ['qa', 'production']) assert.equal(validateBuildEnvironment(mode, envFor(mode)).target, mode)
  assert.notEqual(environments.qa.project, environments.production.project)
  assert.notEqual(environments.qa.worker, environments.production.worker)
  assert.notEqual(environments.qa.origin, environments.production.origin)
})
test('a valid key cannot make swapped backend projects acceptable', () => {
  assert.throws(() => validateBuildEnvironment('production', envFor('qa')), /project/)
  assert.throws(() => validateBuildEnvironment('qa', envFor('production')), /project/)
})
test('missing, disabled or ambiguous shared mode cannot produce a release', () => {
  for (const flag of [undefined, '', 'false', 'TRUE']) assert.throws(() => validateBuildEnvironment('qa', { ...envFor('qa'), VITE_SHARED_BACKEND: flag }), /shared backend/)
  assert.throws(() => validateBuildEnvironment('preview', envFor('qa')), /explicit/)
})
test('server keys, missing keys, duplicate key variables and unexpected exposure are rejected', () => {
  for (const key of [undefined, '', 'sb_secret_fixture_private', 'eyJlegacy']) assert.throws(() => validateBuildEnvironment('qa', { ...envFor('qa'), VITE_SUPABASE_PUBLISHABLE_KEY: key }), /public publishable/)
  assert.throws(() => validateBuildEnvironment('qa', { ...envFor('qa'), VITE_SUPABASE_ANON_KEY: 'legacy' }), /redundant/)
  assert.throws(() => validateBuildEnvironment('qa', { ...envFor('qa'), VITE_SERVICE_ROLE_KEY: 'fixture' }), /unexpected/)
})
