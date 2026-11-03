import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
const run = args => new Promise((resolve, reject) => {
  const child = spawn(process.execPath, [fileURLToPath(new URL(args[0], import.meta.url)), ...args.slice(1)], { stdio: 'inherit' })
  child.on('error', reject)
  child.on('exit', code => code === 0 ? resolve() : reject(new Error(`${args.join(' ')} exited ${code}`)))
})
async function pool(jobs) {
  let index = 0
  await Promise.all(Array.from({ length: 4 }, async () => {
    while (index < jobs.length) await run(jobs[index++])
  }))
}
await pool([['build-test.mjs'], ['build-test.mjs', '--local'], ['build-list-test.mjs'], ['build-section-test.mjs'], ['build-account-test.mjs'], ['build-action-test.mjs'], ['build-audit-test.mjs'], ['build-empty-test.mjs']])
await pool([['verify.mjs'], ['verify-copy.mjs'], ['verify-copy.mjs', '--local'], ['verify-list.mjs'], ['verify-sections.mjs'], ['verify-sections.mjs', '--local'], ['verify-accounts.mjs'], ['verify-actions.mjs'], ['verify-audit.mjs'], ['verify-empty.mjs']])
console.log('PASS: 40 admin UI regression groups; isolated fixtures only, no cloud writes')
