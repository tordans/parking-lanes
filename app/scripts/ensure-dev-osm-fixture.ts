import { access, mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  DEV_OSM_FIXTURE_BBOX,
  DEV_OSM_FIXTURE_RELATIVE_PATH,
  sanitizeDevOsmFixtureTestStreet,
} from '../src/modes/parking/fixtures/dev-map-fixture.const.ts'

type MapBounds = {
  west: number
  south: number
  east: number
  north: number
}

type OsmElement = { type: string; id: number; [key: string]: unknown }

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const fixturePath = path.join(appRoot, DEV_OSM_FIXTURE_RELATIVE_PATH)

function bboxParam({ west, south, east, north }: MapBounds): string {
  return `${west},${south},${east},${north}`
}

function splitBbox(bounds: MapBounds): [MapBounds, MapBounds, MapBounds, MapBounds] {
  const midLon = (bounds.west + bounds.east) / 2
  const midLat = (bounds.south + bounds.north) / 2
  return [
    { west: bounds.west, south: bounds.south, east: midLon, north: midLat },
    { west: midLon, south: bounds.south, east: bounds.east, north: midLat },
    { west: bounds.west, south: midLat, east: midLon, north: bounds.north },
    { west: midLon, south: midLat, east: bounds.east, north: bounds.north },
  ]
}

function mergeElements(parts: OsmElement[][]): OsmElement[] {
  const byKey = new Map<string, OsmElement>()
  for (const elements of parts) {
    for (const element of elements) {
      byKey.set(`${element.type}/${element.id}`, element)
    }
  }
  return [...byKey.values()]
}

async function downloadBbox(bounds: MapBounds): Promise<OsmElement[]> {
  const bbox = bboxParam(bounds)
  const url = `https://www.openstreetmap.org/api/0.6/map?bbox=${bbox}`
  console.log(`Downloading tile ${bbox}`)

  const response = await fetch(url, { headers: { Accept: 'application/json' } })
  if (response.ok) {
    const data = (await response.json()) as { elements?: OsmElement[] }
    if (!Array.isArray(data.elements) || data.elements.length === 0) {
      throw new Error(`OSM map download returned no elements for bbox=${bbox}`)
    }
    console.log(`  → ${data.elements.length} elements`)
    return data.elements
  }

  const body = await response.text()
  const tooManyNodes = response.status === 400 && body.includes('too many nodes')
  if (!tooManyNodes) {
    throw new Error(
      `OSM map download failed: ${response.status} ${response.statusText} (${body.slice(0, 200)})`,
    )
  }

  console.log(`  → too many nodes; splitting ${bbox}`)
  const tiles = splitBbox(bounds)
  const parts: OsmElement[][] = []
  for (const tile of tiles) {
    parts.push(await downloadBbox(tile))
  }
  return mergeElements(parts)
}

async function main() {
  try {
    await access(fixturePath)
    console.log(`Dev OSM fixture already exists: ${fixturePath}`)
    return
  } catch {
    // missing — download below
  }

  console.log(
    `Downloading dev OSM fixture for bbox ${bboxParam(DEV_OSM_FIXTURE_BBOX)} (tiles if needed)`,
  )
  const elements = sanitizeDevOsmFixtureTestStreet(await downloadBbox(DEV_OSM_FIXTURE_BBOX))
  const text = JSON.stringify({ elements })
  await mkdir(path.dirname(fixturePath), { recursive: true })
  await writeFile(fixturePath, text)
  console.log(
    `Wrote dev OSM fixture (${elements.length} elements, ${text.length} bytes) to ${fixturePath}`,
  )
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`Failed to ensure dev OSM fixture: ${message}`)
  process.exit(1)
})
