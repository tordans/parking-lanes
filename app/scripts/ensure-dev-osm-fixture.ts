import { access, mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  DEV_OSM_FIXTURE_RELATIVE_PATH,
  devOsmFixtureBboxParam,
} from '../src/modes/parking/fixtures/dev-map-fixture.const.ts'

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const fixturePath = path.join(appRoot, DEV_OSM_FIXTURE_RELATIVE_PATH)

async function main() {
  try {
    await access(fixturePath)
    console.log(`Dev OSM fixture already exists: ${fixturePath}`)
    return
  } catch {
    // missing — download below
  }

  const bbox = devOsmFixtureBboxParam()
  const url = `https://www.openstreetmap.org/api/0.6/map?bbox=${bbox}`
  console.log(`Downloading dev OSM fixture from ${url}`)

  const response = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!response.ok) {
    throw new Error(`OSM map download failed: ${response.status} ${response.statusText}`)
  }

  const data = (await response.json()) as { elements?: unknown }
  if (!Array.isArray(data.elements) || data.elements.length === 0) {
    throw new Error('OSM map download returned no OSM elements')
  }

  const text = JSON.stringify(data)
  await mkdir(path.dirname(fixturePath), { recursive: true })
  await writeFile(fixturePath, text)
  console.log(`Wrote dev OSM fixture (${text.length} bytes) to ${fixturePath}`)
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`Failed to ensure dev OSM fixture: ${message}`)
  process.exit(1)
})
