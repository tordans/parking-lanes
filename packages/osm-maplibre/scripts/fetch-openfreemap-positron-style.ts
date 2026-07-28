/**
 * Downloads OpenFreeMap Positron, applies local patches, writes checked-in JSON.
 *
 * TEMPORARY — remove with `src/patch-openfreemap-style.ts` once CDN ships
 * https://github.com/hyperknot/openfreemap/issues/107
 * (merged upstream: https://github.com/hyperknot/openfreemap-styles/pull/18).
 *
 * Usage:
 *   bun run fetch-openfreemap-style
 *   FORCE=1 bun run fetch-openfreemap-style   # same (always refreshes)
 *
 * predev calls this so the committed style stays regeneratable without a
 * runtime `transformStyle` (which wiped custom layers).
 */
import { access, mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { StyleSpecification } from 'maplibre-gl'
import { patchOpenFreeMapStyle } from '../src/patch-openfreemap-style.ts'

/** Keep in sync with `OPENFREEMAP_POSITRON_STYLE_URL` in `src/openfreemap-style.ts`. */
const OPENFREEMAP_POSITRON_STYLE_URL = 'https://tiles.openfreemap.org/styles/positron'

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const outPath = path.join(packageRoot, 'src/styles/openfreemap-positron.json')

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}

async function main() {
  const force = process.env.FORCE === '1' || process.argv.includes('--force')
  const exists = await fileExists(outPath)

  // predev: keep the checked-in file unless missing or forced refresh.
  if (exists && !force && process.env.OPENFREEMAP_STYLE_REFRESH !== '1') {
    console.log(`OpenFreeMap Positron style already present: ${outPath}`)
    console.log('  (set FORCE=1 or OPENFREEMAP_STYLE_REFRESH=1 to re-download and re-patch)')
    return
  }

  console.log(`Downloading ${OPENFREEMAP_POSITRON_STYLE_URL}`)
  const response = await fetch(OPENFREEMAP_POSITRON_STYLE_URL)
  if (!response.ok) {
    throw new Error(
      `OpenFreeMap style download failed: ${response.status} ${response.statusText}`,
    )
  }

  const upstream = (await response.json()) as StyleSpecification
  const patched = patchOpenFreeMapStyle(upstream)
  const text = `${JSON.stringify(patched, null, 2)}\n`

  if (exists) {
    const previous = await readFile(outPath, 'utf8')
    if (previous === text) {
      console.log(`OpenFreeMap Positron style unchanged: ${outPath}`)
      return
    }
  }

  await mkdir(path.dirname(outPath), { recursive: true })
  await writeFile(outPath, text)
  console.log(`Wrote patched OpenFreeMap Positron style (${text.length} bytes) to ${outPath}`)
  console.log(
    'TEMPORARY local patch — remove when https://github.com/hyperknot/openfreemap/issues/107 is live on the CDN.',
  )
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`Failed to fetch OpenFreeMap Positron style: ${message}`)
  process.exit(1)
})
