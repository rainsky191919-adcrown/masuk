import { build } from 'vite'
import { fileURLToPath } from 'node:url'
await build({
  configFile: fileURLToPath(new URL('./vite.config.mjs', import.meta.url)), mode: 'navigation-test',
  build: {
    outDir: fileURLToPath(new URL('./bundle-audit', import.meta.url)), emptyOutDir: false,
    lib: { entry: fileURLToPath(new URL('../../src/components/AdminAuditLog.jsx', import.meta.url)), formats: ['es'], fileName: () => 'audit.mjs' },
    rollupOptions: { external: ['react', 'react/jsx-runtime', 'react/jsx-dev-runtime'] },
  },
})
