import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import browserslistToEsbuild from 'browserslist-to-esbuild'
import { defineConfig } from 'vite'

const projectRoot = path.dirname(fileURLToPath(import.meta.url))
const bunLinksCache = path.join(os.homedir(), '.bun/install/cache/links')

export default defineConfig({
  base: '/street-parking-editor/',
  plugins: [
    tailwindcss(),
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
    // Localhost only — one dev URL (OAuth callback used 127.0.0.1). Set a LAN IP here for other devices.
    host: '127.0.0.1',
    fs: {
      allow: [projectRoot, bunLinksCache],
    },
  },
  build: {
    target: browserslistToEsbuild(),
    outDir: 'dist',
  },
})
