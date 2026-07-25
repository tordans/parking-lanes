import type { OsmWay } from '@osm-editor-kit/osm-data'
import type { ParkingConditions } from '../../../utils/types/conditions'
import type { Side } from '../../../utils/types/parking'
import { getColor, getColorByDate } from '../domain/condition-color'
import { isMissingSurfaceForSide } from '../domain/missing-surface'
import { getSideConditions } from '../domain/side-conditions'
import { laneStyleByZoom } from '../lane-styles'
import { parkingSideColors } from '../side-colors'
import type { ParkingFeature, ParkingFeatureCollection } from './types'

const highwayRegex =
  /^motorway|trunk|primary|secondary|tertiary|unclassified|residential|service|living_street/
const majorHighwayRegex = /^motorway|trunk|primary|secondary|tertiary|unclassified|residential/

function wayIsMajor(tags: OsmWay['tags']): boolean | undefined {
  if (!tags.highway) return undefined
  return tags.highway.search(majorHighwayRegex) >= 0
}

function toCoords(nodeCoords: Record<number, number[]>, way: OsmWay): [number, number][] {
  return way.nodes.map((nodeId) => {
    const node = nodeCoords[nodeId]!
    return [node[1]!, node[0]!] as [number, number]
  })
}

function createLaneFeature(
  coords: [number, number][],
  conditions: ParkingConditions | undefined,
  side: Side,
  way: OsmWay,
  offset: number,
  isMajor: boolean,
  zoom: number,
  laneId: string,
): ParkingFeature {
  const style = laneStyleByZoom[zoom] ?? laneStyleByZoom[18]!
  return {
    type: 'Feature',
    id: laneId,
    geometry: { type: 'LineString', coordinates: coords },
    properties: {
      featureId: laneId,
      kind: 'lane',
      color: getColor(conditions?.default) ?? '#888888',
      weight: isMajor ? (style.weightMajor ?? 2) : (style.weightMinor ?? 1),
      offset: side === 'right' ? offset : -offset,
      osmType: way.type,
      osmId: way.id,
      isMajor,
      missingSurface: isMissingSurfaceForSide(way.tags, side) ? 1 : 0,
    },
  }
}

export function parseParkingLaneFeatures(
  way: OsmWay,
  nodeCoords: Record<number, number[]>,
  zoom: number,
): ParkingFeature[] {
  const isMajor = wayIsMajor(way.tags)
  if (typeof isMajor !== 'boolean') return []

  const coords = toCoords(nodeCoords, way)
  const features: ParkingFeature[] = []
  let emptyway = true

  for (const side of ['right', 'left'] as Side[]) {
    const conditions = getSideConditions(side, way.tags)
    if (
      conditions.default != null ||
      (conditions.conditionalValues && conditions.conditionalValues.length > 0)
    ) {
      const laneId = side + way.id
      const style = laneStyleByZoom[zoom] ?? laneStyleByZoom[18]!
      const offset = isMajor ? (style.offsetMajor ?? 1) : (style.offsetMinor ?? 0.5)
      features.push(createLaneFeature(coords, conditions, side, way, offset, isMajor, zoom, laneId))
      emptyway = false
    }
  }

  if (emptyway && way.tags.highway && highwayRegex.test(way.tags.highway)) {
    const laneId = 'empty' + way.id
    features.push(createLaneFeature(coords, undefined, 'right', way, 0, isMajor, zoom, laneId))
  }

  return features
}

export function updateLaneFeatureColors(
  features: ParkingFeature[],
  datetime: Date,
  wayTags: Record<number, OsmWay['tags']>,
): ParkingFeature[] {
  return features.map((feature) => {
    if (feature.properties.kind !== 'lane') return feature

    const way = wayTags[feature.properties.osmId]
    if (!way) return feature

    const side = feature.properties.featureId.startsWith('left')
      ? 'left'
      : feature.properties.featureId.startsWith('right')
        ? 'right'
        : 'right'
    const conditions = getSideConditions(side, way)
    return {
      ...feature,
      properties: {
        ...feature.properties,
        color: getColorByDate(conditions, datetime) ?? '#888888',
      },
    }
  })
}

export function updateLaneFeatureStyles(
  features: ParkingFeature[],
  zoom: number,
): ParkingFeature[] {
  const style = laneStyleByZoom[zoom] ?? laneStyleByZoom[18]!
  return features.map((feature) => {
    if (feature.properties.kind !== 'lane') return feature
    if (
      feature.properties.featureId === 'right' ||
      feature.properties.featureId === 'left' ||
      feature.properties.featureId.startsWith('empty')
    ) {
      return feature
    }

    const isMajor = feature.properties.isMajor ?? false
    const offsetBase = isMajor ? style.offsetMajor : style.offsetMinor
    const weight = isMajor ? style.weightMajor : style.weightMinor
    const sideOffset = feature.properties.offset > 0 ? 1 : -1

    return {
      ...feature,
      properties: {
        ...feature.properties,
        offset: sideOffset * (offsetBase ?? 1),
        weight: weight ?? 2,
      },
    }
  })
}

export function createBacklightFeatures(
  coords: [number, number][],
  zoom: number,
): ParkingFeature[] {
  const style = laneStyleByZoom[zoom] ?? laneStyleByZoom[18]!
  const n = 3
  const offsetMajor = style.offsetMajor ?? 1

  return [
    {
      type: 'Feature',
      id: 'backlight-right',
      geometry: { type: 'LineString', coordinates: coords },
      properties: {
        featureId: 'backlight-right',
        kind: 'backlight-right',
        color: parkingSideColors.right,
        weight: offsetMajor * n - 4,
        offset: offsetMajor * n,
        osmType: 'way',
        osmId: 0,
      },
    },
    {
      type: 'Feature',
      id: 'backlight-left',
      geometry: { type: 'LineString', coordinates: coords },
      properties: {
        featureId: 'backlight-left',
        kind: 'backlight-left',
        color: parkingSideColors.left,
        weight: (style.offsetMajor ?? 0.5) * n - 4,
        offset: -((style.offsetMajor ?? 0.5) * n),
        osmType: 'way',
        osmId: 0,
      },
    },
  ]
}

export function mergeFeatureCollections(
  ...collections: ParkingFeatureCollection[]
): ParkingFeatureCollection {
  const features: ParkingFeature[] = []
  const seen = new Set<string>()
  for (const collection of collections) {
    for (const feature of collection.features) {
      const id = feature.properties.featureId
      if (seen.has(id)) continue
      seen.add(id)
      features.push(feature)
    }
  }
  return { type: 'FeatureCollection', features }
}

export function coordsFromWay(
  way: OsmWay,
  nodeCoords: Record<number, number[]>,
): [number, number][] {
  return toCoords(nodeCoords, way)
}

export function applyChangedWayToFeatures(
  features: ParkingFeature[],
  newOsm: OsmWay,
  nodeCoords: Record<number, number[]>,
  datetime: Date,
  zoom: number,
): { features: ParkingFeature[]; added: ParkingFeature[] } {
  const parsed = parseParkingLaneFeatures(newOsm, nodeCoords, zoom)
  const withoutOld = features.filter(
    (f) => f.properties.osmId !== newOsm.id || f.properties.kind !== 'lane',
  )
  const colored = updateLaneFeatureColors(parsed, datetime, { [newOsm.id]: newOsm.tags })
  const merged = [...withoutOld, ...colored]
  const added = colored.filter(
    (f) => !features.some((existing) => existing.properties.featureId === f.properties.featureId),
  )

  return { features: merged, added }
}
