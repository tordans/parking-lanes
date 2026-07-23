import axios from 'axios'
import type { MapBounds } from '../parking/map/types'
import { type RawOsmData } from './types/osm-data'
import { type ParsedOsmData } from './types/osm-data-storage'

export const osmData: ParsedOsmData = {
  relations: {},
  ways: {},
  nodes: {},
  nodeCoords: {},
  waysInRelation: {},
}

let fetchedEnvelope: MapBounds | undefined

export function isViewportFetched(bounds: MapBounds): boolean {
  if (!fetchedEnvelope) return false
  return (
    bounds.west >= fetchedEnvelope.west &&
    bounds.south >= fetchedEnvelope.south &&
    bounds.east <= fetchedEnvelope.east &&
    bounds.north <= fetchedEnvelope.north
  )
}

export function expandFetchedEnvelope(
  envelope: MapBounds | undefined,
  viewport: MapBounds,
): MapBounds {
  if (!envelope) return { ...viewport }
  return {
    west: Math.min(envelope.west, viewport.west),
    south: Math.min(envelope.south, viewport.south),
    east: Math.max(envelope.east, viewport.east),
    north: Math.max(envelope.north, viewport.north),
  }
}

export function resetFetchedEnvelope(): void {
  fetchedEnvelope = undefined
}

/** @internal test helper */
export function setFetchedEnvelopeForTest(envelope: MapBounds | undefined): void {
  fetchedEnvelope = envelope
}

export type DownloadBboxResult = {
  newData: ParsedOsmData | null
  skipped: boolean
}

/**
 * Fetch OSM data for viewport bounds. Skips the network when the viewport is
 * already covered by a previous fetch unless `force` is set.
 * @throws {Error} Throws error when HTTP request fails (eg. HTTP 429 when too many requests)
 */
export async function downloadBbox(
  bounds: MapBounds,
  url: string,
  options?: { force?: boolean },
): Promise<DownloadBboxResult> {
  if (!options?.force && isViewportFetched(bounds)) {
    return { newData: null, skipped: true }
  }

  fetchedEnvelope = expandFetchedEnvelope(fetchedEnvelope, bounds)

  const osmResp: RawOsmData = await downloadContent(url)
  const newData = parseOsmResp(osmResp)

  if (newData) {
    Object.assign(osmData.nodes, newData.nodes)
    Object.assign(osmData.nodeCoords, newData.nodeCoords)
    Object.assign(osmData.waysInRelation, newData.waysInRelation)

    for (const wayId in newData.ways) {
      if (osmData.ways[wayId]?.version >= newData.ways[wayId].version) continue
      osmData.ways[wayId] = newData.ways[wayId]
    }

    for (const relationId in newData.relations) {
      if (osmData.relations[relationId]?.version >= newData.relations[relationId].version) continue
      osmData.relations[relationId] = newData.relations[relationId]
    }
  }

  return { newData, skipped: false }
}

async function downloadContent(url: string): Promise<RawOsmData> {
  const resp = await axios.get(url, {
    headers: {
      Accept: 'application/json',
    },
  })
  return resp.data
}

function parseOsmResp(osmResp: RawOsmData): ParsedOsmData {
  const newData: ParsedOsmData = {
    relations: {},
    ways: {},
    nodes: {},
    nodeCoords: {},
    waysInRelation: {},
  }

  for (const el of osmResp.elements) {
    switch (el.type) {
      case 'node':
        newData.nodeCoords[el.id] = [el.lat, el.lon]

        if (el.tags) newData.nodes[el.id] = el

        break

      case 'way':
        newData.ways[el.id] = el
        break

      case 'relation':
        newData.relations[el.id] = el

        for (const member of el.members) {
          if (member.type === 'way' && newData.ways[member.ref])
            newData.waysInRelation[member.ref] = true
        }
        break

      default:
        throw new Error('Not supported osm type ' + (el as { type: string }).type)
    }
  }
  return newData
}
