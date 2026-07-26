import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { paraglideVitePlugin } from '@inlang/paraglide-js'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import browserslistToEsbuild from 'browserslist-to-esbuild'
import { defineConfig } from 'vite'

const projectRoot = path.dirname(fileURLToPath(import.meta.url))
const monorepoRoot = path.resolve(projectRoot, '..')
const bunLinksCache = path.join(os.homedir(), '.bun/install/cache/links')
const smoothnessDataRoot = path.resolve(
  monorepoRoot,
  '../osm-surface-smoothness-workspace/osm-surface-smoothness-tagging/packages/data',
)
const eliPackageRoot = path.resolve(
  monorepoRoot,
  '../maplibre-editor-layer-index/packages/maplibre-editor-layer-index',
)

export default defineConfig({
  envDir: monorepoRoot,
  envPrefix: ['VITE_', 'OSM_'],
  base: '/street-space-editor/',
  plugins: [
    paraglideVitePlugin({
      project: './project.inlang',
      outdir: './paraglide',
      strategy: ['localStorage', 'baseLocale'],
    }),
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
      '@app': projectRoot,
    },
  },
  // Local file: package — skip prebundle so ELI dist updates are picked up without stale .vite cache.
  optimizeDeps: {
    exclude: ['maplibre-editor-layer-index'],
  },
  server: {
    port: 33444,
    // Localhost only — one dev URL (OAuth callback used 127.0.0.1). Set a LAN IP here for other devices.
    host: '127.0.0.1',
    fs: {
      allow: [projectRoot, monorepoRoot, bunLinksCache, smoothnessDataRoot, eliPackageRoot],
    },
  },
  build: {
    target: browserslistToEsbuild(),
    outDir: 'dist',
  },
})
