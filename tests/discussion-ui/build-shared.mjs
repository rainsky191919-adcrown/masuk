import { build } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'
const outDir='tests/discussion-ui/offline/shared'
await build({configFile:false,envDir:false,plugins:[{name:'isolated-discussion-api',enforce:'pre',resolveId(source){if(source.endsWith('/lib/sharedBackend'))return path.resolve('tests/discussion-ui/shared-backend.mjs').replaceAll('\\','/')}},react()],define:{'process.env.NODE_ENV':'"production"'},mode:'ui-test',base:'./',build:{outDir,emptyOutDir:false,minify:false,lib:{entry:'tests/discussion-ui/shared-entry.jsx',name:'DiscussionSharedFixture',formats:['iife'],fileName:()=> 'app.js',cssFileName:'app'}}})
fs.writeFileSync(`${outDir}/index.html`,'<!doctype html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="app.css"><title>Isolated shared discussion fixture</title></head><body><div id="root"></div><script src="app.js"></script></body></html>')
