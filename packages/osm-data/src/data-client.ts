import axios from 'axios'
import { type RawOsmData } from './types/osm-data'
import { type ParsedOsmData } from './types/osm-data-storage'

export function emptyParsedOsmData(): ParsedOsmData {
  return {
    relations: {},
    ways: {},
    nodes: {},
    nodeCoords: {},
    waysInRelation: {},
  }
}

export function mergeParsedOsm(existing: ParsedOsmData, incoming: ParsedOsmData): ParsedOsmData {
  const merged: ParsedOsmData = {
    relations: { ...existing.relations },
    ways: { ...existing.ways },
    nodes: { ...existing.nodes },
    nodeCoords: { ...existing.nodeCoords },
    waysInRelation: { ...existing.waysInRelation },
  }

  Object.assign(merged.nodes, incoming.nodes)
  Object.assign(merged.nodeCoords, incoming.nodeCoords)
  Object.assign(merged.waysInRelation, incoming.waysInRelation)

  for (const wayId in incoming.ways) {
    const incomingWay = incoming.ways[wayId]!
    if (merged.ways[wayId]?.version >= incomingWay.version) continue
    merged.ways[wayId] = incomingWay
  }

  for (const relationId in incoming.relations) {
    const incomingRelation = incoming.relations[relationId]!
    if (merged.relations[relationId]?.version >= incomingRelation.version) continue
    merged.relations[relationId] = incomingRelation
  }

  return merged
}

/**
 * Download and parse OSM data from a URL.
 * @throws {Error} Throws error when HTTP request fails (eg. HTTP 429 when too many requests)
 */
export async function downloadOsmData(url: string): Promise<ParsedOsmData> {
  const osmResp: RawOsmData = await downloadContent(url)
  return parseOsmResp(osmResp)
}

async function downloadContent(url: string): Promise<RawOsmData> {
  const resp = await axios.get(url, {
    headers: {
      Accept: 'application/json',
    },
  })
  return resp.data
}

export function parseOsmResp(osmResp: RawOsmData): ParsedOsmData {
  const newData = emptyParsedOsmData()

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
