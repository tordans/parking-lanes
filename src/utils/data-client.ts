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

let lastBounds: MapBounds | undefined

/**
 * Get OSM data within specified bounds
 * @throws {Error} Throws error when HTTP request fails (eg. HTTP 429 when too many requests)
 */
export async function downloadBbox(bounds: MapBounds, url: string): Promise<ParsedOsmData | null> {
  if (lastBounds !== undefined && withinLastBounds(bounds, lastBounds)) return null

  lastBounds = bounds

  const osmResp: RawOsmData = await downloadContent(url)
  const newData = parseOsmResp(osmResp)

  if (newData) {
    Object.assign(osmData.nodes, newData.nodes)
    Object.assign(osmData.nodeCoords, newData.nodeCoords)
    Object.assign(osmData.waysInRelation, newData.waysInRelation)

    for (const wayId in newData.ways) {
      if (osmData.ways[wayId]?.version >= newData.ways[wayId].version) continue
      else osmData.ways[wayId] = newData.ways[wayId]
    }

    for (const relationId in newData.relations) {
      if (osmData.relations[relationId]?.version >= newData.relations[relationId].version) continue
      else osmData.relations[relationId] = newData.relations[relationId]
    }
  }

  return newData
}

function withinLastBounds(newBounds: MapBounds, oldBounds: MapBounds) {
  return (
    newBounds.west > oldBounds.west &&
    newBounds.south > oldBounds.south &&
    newBounds.east < oldBounds.east &&
    newBounds.north < oldBounds.north
  )
}

export function resetLastBounds(): void {
  lastBounds = undefined
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
