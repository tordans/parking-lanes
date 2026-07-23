import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import browserslistToEsbuild from 'browserslist-to-esbuild'
import { defineConfig } from 'vite'

const projectRoot = path.dirname(fileURLToPath(import.meta.url))
const bunLinksCache = path.join(os.homedir(), '.bun/install/cache/links')

export default defineConfig({
  base: '/street-parking-editor/',
  plugins: [
    tanstackRouter({ target: 'react', autoCodeSplitting: true }),
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler', {}]],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(projectRoot, 'src'),
    },
  },
  server: {
    port: 33444,
    host: '0.0.0.0',
    fs: {
      allow: [projectRoot, bunLinksCache],
    },
  },
  build: {
    target: browserslistToEsbuild(),
    outDir: 'dist',
  },
})
