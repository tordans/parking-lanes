import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { paraglideVitePlugin } from '@inlang/paraglide-js'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import browserslistToEsbuild from 'browserslist-to-esbuild'
import { defineConfig } from 'vite'
import { devOsmMapFixturePlugin } from './vite-plugins/dev-osm-map-fixture'

const projectRoot = path.dirname(fileURLToPath(import.meta.url))
const monorepoRoot = path.resolve(projectRoot, '..')
const bunLinksCache = path.join(os.homedir(), '.bun/install/cache/links')

const appPackage = JSON.parse(readFileSync(path.join(projectRoot, 'package.json'), 'utf8')) as {
  version: string
}

function resolveAppBuildDate(): string {
  const fromEnv = process.env.APP_BUILD_DATE?.trim()
  if (fromEnv) return fromEnv
  try {
    return execSync('git log -1 --format=%cs', {
      cwd: monorepoRoot,
      encoding: 'utf8',
    }).trim()
  } catch {
    return new Date().toISOString().slice(0, 10)
  }
}

const appVersion = appPackage.version
const appBuildDate = resolveAppBuildDate()

export default defineConfig({
  envDir: monorepoRoot,
  envPrefix: ['VITE_', 'OSM_'],
  base: '/street-space-editor/',
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
    __APP_BUILD_DATE__: JSON.stringify(appBuildDate),
  },
  plugins: [
    devOsmMapFixturePlugin(),
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
  server: {
    port: 33444,
    // Localhost only — one dev URL (OAuth callback used 127.0.0.1). Set a LAN IP here for other devices.
    host: '127.0.0.1',
    fs: {
      allow: [projectRoot, monorepoRoot, bunLinksCache],
    },
  },
  build: {
    target: browserslistToEsbuild(),
    outDir: 'dist',
  },
})
