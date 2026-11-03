import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

export default defineConfig(({ mode }) => ({
  root: fileURLToPath(new URL('../../', import.meta.url)),
  plugins: [
    {
      name: 'isolated-navigation-fixture',
      enforce: 'pre',
      resolveId(source) {
        if (mode !== 'acceptance-test' && /(?:^|\/)MapPicker(?:\.jsx)?$/.test(source)) return '\0navigation-no-map'
        if (/(?:^|\/)sharedBackend(?:\.js)?$/.test(source)) return fileURLToPath(new URL('./backend.mjs', import.meta.url))
        if (/(?:^|\/)supabase(?:\.js)?$/.test(source)) return '\0navigation-no-cloud'
      },
      load(id) {
        if (id === '\0navigation-no-map') return 'export default function MapPicker() { return null }'
        if (id === '\0navigation-no-cloud') return 'export const hasSupabaseConfig = false; export const supabase = null;'
      },
      transformIndexHtml(html) {
        return html.replace(/<title>.*?<\/title>/, '<title>LOCAL ONLY · Edit return verification</title>')
          .replace('<head>', '<head><script>if (!localStorage.getItem("masuk-user")) localStorage.setItem("masuk-user", JSON.stringify({ id: "demo:isolated-preview", name: "Local Preview QA", role: "admin" }));</script>')
      },
    },
    react(),
  ],
  server: { host: '127.0.0.1', port: 5186, strictPort: true },
}))
