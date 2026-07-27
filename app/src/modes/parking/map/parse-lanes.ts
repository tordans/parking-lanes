import type { OsmWay } from '@osm-editor-kit/osm-data'
import {
  isRoadLikeHighway,
  matchesHighwayInclusionStyle,
  ROAD_LIKE_HIGHWAY_BASE_REGEX,
  type HighwayInclusionStyle,
} from '@osm-editor-kit/osm-way-chain'
import type { ParkingConditions } from '../../../utils/types/conditions'
import type { Side, StyleMapInterface } from '../../../utils/types/parking'
import { getColor, getColorByDate } from '../domain/condition-color'
import { isMissingSurfaceForSide } from '../domain/missing-surface'
import { getSideConditions } from '../domain/side-conditions'
import { laneStyleByZoom } from '../lane-styles'
import { parkingSideColors } from '../side-colors'
import type { ParkingFeature, ParkingFeatureCollection } from './types'

const highwayRegex = ROAD_LIKE_HIGHWAY_BASE_REGEX
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

function laneSpan(isMajor: boolean, style: StyleMapInterface) {
  return isMajor ? (style.offsetMajor ?? 2) : (style.offsetMinor ?? 1)
}

function laneOffsetFromSpan(span: number, side: Side) {
  const halfSpan = span / 2
  return side === 'right' ? halfSpan : -halfSpan
}

function createLaneFeature(
  coords: [number, number][],
  conditions: ParkingConditions | undefined,
  side: Side,
  way: OsmWay,
  isMajor: boolean,
  zoom: number,
  laneId: string,
): ParkingFeature {
  const style = laneStyleByZoom[zoom] ?? laneStyleByZoom[18]!
  const span = laneSpan(isMajor, style)
  return {
    type: 'Feature',
    id: laneId,
    geometry: { type: 'LineString', coordinates: coords },
    properties: {
      featureId: laneId,
      kind: 'lane',
      color: getColor(conditions?.default) ?? '#888888',
      weight: span,
      offset: laneOffsetFromSpan(span, side),
      side,
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
  inclusionStyle: HighwayInclusionStyle,
): ParkingFeature[] {
  if (!isRoadLikeHighway(way.tags)) return []
  if (!matchesHighwayInclusionStyle(way.tags, inclusionStyle)) return []
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
      features.push(createLaneFeature(coords, conditions, side, way, isMajor, zoom, laneId))
      emptyway = false
    }
  }

  if (emptyway && way.tags.highway && highwayRegex.test(way.tags.highway)) {
    for (const side of ['right', 'left'] as Side[]) {
      const laneId = side + way.id
      features.push(createLaneFeature(coords, undefined, side, way, isMajor, zoom, laneId))
    }
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
    if (feature.properties.featureId.startsWith('empty')) {
      return feature
    }

    const isMajor = feature.properties.isMajor ?? false
    const span = laneSpan(isMajor, style)
    const side =
      feature.properties.side ??
      (feature.properties.offset > 0 ? 'right' : feature.properties.offset < 0 ? 'left' : 'right')

    return {
      ...feature,
      properties: {
        ...feature.properties,
        side,
        offset: laneOffsetFromSpan(span, side),
        weight: span,
      },
    }
  })
}

export function createBacklightFeatures(
  coords: [number, number][],
  zoom: number,
): ParkingFeature[] {
  const style = laneStyleByZoom[zoom] ?? laneStyleByZoom[18]!
  const spanScale = 1.25
  const rightSpan = (style.offsetMajor ?? 1) * spanScale
  const leftSpan = (style.offsetMajor ?? 0.5) * spanScale

  return [
    {
      type: 'Feature',
      id: 'backlight-right',
      geometry: { type: 'LineString', coordinates: coords },
      properties: {
        featureId: 'backlight-right',
        kind: 'backlight-right',
        color: parkingSideColors.right,
        weight: rightSpan,
        offset: laneOffsetFromSpan(rightSpan, 'right'),
        side: 'right',
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
        weight: leftSpan,
        offset: laneOffsetFromSpan(leftSpan, 'left'),
        side: 'left',
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
  inclusionStyle: HighwayInclusionStyle,
): { features: ParkingFeature[]; added: ParkingFeature[] } {
  const parsed = parseParkingLaneFeatures(newOsm, nodeCoords, zoom, inclusionStyle)
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
