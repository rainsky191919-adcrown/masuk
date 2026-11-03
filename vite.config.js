import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { execFileSync } from 'node:child_process'
import { validateBuildEnvironment } from './config/environments.mjs'

export default defineConfig(({ mode, command }) => {
  const release = command === 'build' ? validateBuildEnvironment(mode, loadEnv(mode, process.cwd(), 'VITE_')) : null
  return {
    plugins: [react(), ...(release ? [{
      name: 'verified-release-target',
      generateBundle() {
        this.emitFile({ type: 'asset', fileName: 'build-info.json', source: JSON.stringify({ ...release, source_sha: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim() }, null, 2) + '\n' })
      },
    }] : [])],
    build: { outDir: `dist/${mode}` },
  }
})
