import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { readFile as readFilePromise } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { paraglideVitePlugin } from '@inlang/paraglide-js'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import browserslistToEsbuild from 'browserslist-to-esbuild'
import { defineConfig, type Plugin } from 'vite'
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

const PANORAMAX_VIEWER = `${path.sep}@panoramax${path.sep}web-viewer${path.sep}`
const PANORAMAX_CSS_SUFFIX = '\0panoramax-constructable-css'
const PBF_SHIM_ID = '\0panoramax-pbf-default'

function panoramaxPbfDefaultExportPlugin(): Plugin {
  const pbfPath = path.resolve(projectRoot, 'node_modules/pbf/index.js')
  return {
    name: 'panoramax-pbf-default-export',
    enforce: 'pre',
    resolveId(source, importer) {
      if (source !== 'pbf' || !importer?.includes(PANORAMAX_VIEWER)) {
        return null
      }
      return PBF_SHIM_ID
    },
    load(id) {
      if (id !== PBF_SHIM_ID) {
        return null
      }
      return `export { PbfReader as default } from ${JSON.stringify(pbfPath)};\n`
    },
  }
}

function panoramaxConstructableCssPlugin(): Plugin {
  return {
    name: 'panoramax-constructable-css',
    enforce: 'pre',
    transform(code, id) {
      if (!id.includes(PANORAMAX_VIEWER) || !id.endsWith('.js')) {
        return null
      }
      const stripped = code.replace(
        /(\bfrom\s+["'][^"']+\.css["'])\s+with\s+\{\s*type:\s*["']css["']\s*\}/g,
        '$1',
      )
      return stripped === code ? null : { code: stripped, map: null }
    },
    async resolveId(source, importer) {
      if (!importer?.includes(PANORAMAX_VIEWER) || !source.endsWith('.css')) {
        return null
      }
      const resolved = await this.resolve(source, importer, { skipSelf: true })
      if (!resolved) {
        return null
      }
      return resolved.id + PANORAMAX_CSS_SUFFIX
    },
    async load(id) {
      if (!id.endsWith(PANORAMAX_CSS_SUFFIX)) {
        return null
      }
      const cssPath = id.slice(0, -PANORAMAX_CSS_SUFFIX.length)
      const css = await readFilePromise(cssPath, 'utf-8')
      return `const sheet = new CSSStyleSheet();\nsheet.replaceSync(${JSON.stringify(css)});\nexport default sheet;\n`
    },
  }
}

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
    panoramaxConstructableCssPlugin(),
    panoramaxPbfDefaultExportPlugin(),
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
      // @photo-sphere-viewer (via @panoramax/web-viewer) peers on three; Bun links
      // those packages outside app/node_modules, so Vite cannot resolve three otherwise.
      three: path.resolve(projectRoot, 'node_modules/three/build/three.module.js'),
      // Panoramax default-imports json5; Vite otherwise picks the UMD browser build.
      json5: path.resolve(projectRoot, 'node_modules/json5/dist/index.mjs'),
      '@panoramax/web-viewer': path.resolve(
        projectRoot,
        'node_modules/@panoramax/web-viewer/build/esm/index_photoviewer.js',
      ),
    },
  },
  optimizeDeps: {
    exclude: ['@panoramax/web-viewer'],
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
