import { build } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
const outDir='tests/discussion-ui/offline'
await build({configFile:false,envDir:false,plugins:[react()],define:{'process.env.NODE_ENV':'"production"'},mode:'ui-test',base:'./',build:{outDir,emptyOutDir:false,minify:false,lib:{entry:'src/main.jsx',name:'DiscussionLocalTest',formats:['iife'],fileName:()=> 'app.js',cssFileName:'app'}}})
fs.writeFileSync(`${outDir}/index.html`,'<!doctype html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="app.css"><title>Local discussion verification</title></head><body><div id="root"></div><script src="app.js"></script></body></html>')
