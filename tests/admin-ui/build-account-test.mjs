import { build } from 'vite'
import { fileURLToPath } from 'node:url'
await build({
  configFile: fileURLToPath(new URL('./vite.config.mjs', import.meta.url)), mode: 'navigation-test',
  build: {
    outDir: fileURLToPath(new URL('./bundle-accounts', import.meta.url)), emptyOutDir: false,
    lib: { entry: fileURLToPath(new URL('../../src/components/AdminAccountRoles.jsx', import.meta.url)), formats: ['es'], fileName: () => 'accounts.mjs' },
    rollupOptions: { external: ['react', 'react/jsx-runtime', 'react/jsx-dev-runtime'] },
  },
})
