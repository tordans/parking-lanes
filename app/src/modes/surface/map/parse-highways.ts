import type { OsmTags, ParsedOsmData } from '@osm-editor-kit/osm-data'
import {
  expandSidepaths,
  formatSidepathFeatureId,
  type SidepathPrefix,
  type SidepathSide,
} from '@osm-editor-kit/osm-sidepath-tags'
import type { Feature, LineString } from 'geojson'
import type { MapBounds } from '../../parking/map/types'
import {
  matchesStreetSpaceInclusion,
  type HighwayInclusionStyle,
} from '../../../shell/map/street-space-way-policy'
import { roadWidthFromTags } from '../../width/domain/road-width-from-tags'
import { isWidthModeLinkWay } from '../../width/domain/width-link-filter'
import { classifySurfaceInfra, type SurfaceInfraClass } from '../domain/surface-infra-class'
import {
  readTaggedSmoothness,
  readTaggedSurface,
  surfacePaintState,
  type SurfacePaintState,
} from '../domain/surface-tag-read'
import {
  isSeparateSidepathValue,
  SURFACE_SEGREGATED_HALF_GAP_M,
  surfaceSidepathOffsetMeters,
} from './surface-sidepath-offset'

const majorHighwayRegex = /^motorway|trunk|primary|secondary|tertiary|unclassified|residential/

/** Major roads get a wider band than other ways; surface mode uses two categorical widths. */
export function surfaceWayIsMajor(highway: string | undefined): boolean {
  if (!highway) return false
  return majorHighwayRegex.test(highway)
}

export type SurfaceHighwayProperties = {
  osmId: number
  osmType: 'way'
  featureId: string
  kind: 'highway'
  highway: string
  infra: SurfaceInfraClass
  surface?: string
  smoothness?: string
  paintState: SurfacePaintState
  missingSurface: boolean
  missingSmoothness: boolean
  isMajor: boolean
  /** Segregated foot/cycle channel; omitted for ordinary road centerlines. */
  channel?: 'foot' | 'cycle'
  /** Unsigned metres from centerline; sign comes from `side` in paint. */
  offsetMeters?: number
  side?: SidepathSide
}

export type SurfaceSidepathProperties = {
  osmId: number
  osmType: 'way'
  featureId: string
  kind: 'sidepath'
  prefix: SidepathPrefix
  side: SidepathSide
  highway: string
  infra: SurfaceInfraClass
  surface?: string
  smoothness?: string
  paintState: SurfacePaintState
  missingSurface: boolean
  missingSmoothness: boolean
  isMajor: boolean
  parentRoadWidthM: number
  /** Unsigned metres from centerline; sign comes from `side` in paint. */
  offsetMeters: number
}

export type SurfaceFeatureProperties = SurfaceHighwayProperties | SurfaceSidepathProperties
export type SurfaceFeature = Feature<LineString, SurfaceFeatureProperties>
export type SurfaceFeatureCollection = GeoJSON.FeatureCollection<
  LineString,
  SurfaceFeatureProperties
>

function coordInBounds(lat: number, lon: number, bounds: MapBounds): boolean {
  return lat >= bounds.south && lat <= bounds.north && lon >= bounds.west && lon <= bounds.east
}

function wayIntersectsBounds(
  way: { nodes: number[] },
  nodeCoords: Record<number, number[]>,
  bounds: MapBounds,
): boolean {
  return way.nodes.some((nodeId) => {
    const coord = nodeCoords[nodeId]
    if (!coord) return false
    return coordInBounds(coord[0]!, coord[1]!, bounds)
  })
}

function wayCoordinates(
  way: { nodes: number[] },
  nodeCoords: Record<number, number[]>,
): [number, number][] {
  return way.nodes
    .map((nodeId) => {
      const coord = nodeCoords[nodeId]
      if (!coord) return null
      return [coord[1]!, coord[0]!] as [number, number]
    })
    .filter((coord): coord is [number, number] => coord != null)
}

function surfacePropertiesFromTags(
  tags: Record<string, string>,
  infra: SurfaceInfraClass,
  isMajor: boolean,
): Pick<
  SurfaceHighwayProperties,
  | 'surface'
  | 'smoothness'
  | 'paintState'
  | 'missingSurface'
  | 'missingSmoothness'
  | 'isMajor'
  | 'infra'
> {
  const paintState = surfacePaintState(tags)
  const surface = readTaggedSurface(tags)
  const smoothness = readTaggedSmoothness(tags)

  return {
    infra,
    surface,
    smoothness,
    paintState,
    missingSurface: paintState === 'missing_surface',
    missingSmoothness: paintState === 'missing_smoothness',
    isMajor,
  }
}

function channelTagsFromWay(tags: OsmTags, channel: 'foot' | 'cycle'): Record<string, string> {
  if (channel === 'cycle') {
    return {
      surface: tags['cycleway:surface'] ?? '',
      smoothness: tags['cycleway:smoothness'] ?? '',
      'sett:length': tags['cycleway:sett:length'] ?? '',
    }
  }

  if (tags['footway:surface'] != null || tags['footway:smoothness'] != null) {
    return {
      surface: tags['footway:surface'] ?? '',
      smoothness: tags['footway:smoothness'] ?? '',
      'sett:length': tags['footway:sett:length'] ?? '',
    }
  }

  return {
    surface: tags.surface ?? '',
    smoothness: tags.smoothness ?? '',
    'sett:length': tags['sett:length'] ?? '',
  }
}

function compactTags(tags: Record<string, string>): Record<string, string> {
  const result: Record<string, string> = {}
  for (const [key, value] of Object.entries(tags)) {
    if (value) result[key] = value
  }
  return result
}

export function parseSurfaceFeaturesFromData(
  data: ParsedOsmData,
  bounds: MapBounds,
  inclusionStyle: HighwayInclusionStyle,
): SurfaceFeature[] {
  const features: SurfaceFeature[] = []

  for (const way of Object.values(data.ways)) {
    if (!way.tags?.highway) continue
    if (!matchesStreetSpaceInclusion(way.tags, inclusionStyle)) continue
    if (isWidthModeLinkWay(way.tags)) continue
    if (!wayIntersectsBounds(way, data.nodeCoords, bounds)) continue

    const coordinates = wayCoordinates(way, data.nodeCoords)
    if (coordinates.length < 2) continue

    const width = roadWidthFromTags(way.tags)
    const isMajor = surfaceWayIsMajor(way.tags.highway)
    const isSegregated = way.tags.segregated === 'yes'

    if (isSegregated) {
      for (const channel of ['foot', 'cycle'] as const) {
        const channelTags = compactTags(channelTagsFromWay(way.tags, channel))
        const channelProps = surfacePropertiesFromTags(
          channelTags,
          channel === 'cycle' ? 'bike' : classifySurfaceInfra(way.tags),
          isMajor,
        )
        const side: SidepathSide = channel === 'foot' ? 'left' : 'right'

        features.push({
          type: 'Feature',
          id: `${way.id}-${channel}`,
          geometry: {
            type: 'LineString',
            coordinates,
          },
          properties: {
            osmId: way.id,
            osmType: 'way',
            featureId: `way/${way.id}/${channel}`,
            kind: 'highway',
            highway: way.tags.highway,
            channel,
            side,
            offsetMeters: SURFACE_SEGREGATED_HALF_GAP_M,
            ...channelProps,
          },
        })
      }
    } else {
      const highwayProps = surfacePropertiesFromTags(
        way.tags,
        classifySurfaceInfra(way.tags),
        isMajor,
      )

      features.push({
        type: 'Feature',
        id: way.id,
        geometry: {
          type: 'LineString',
          coordinates,
        },
        properties: {
          osmId: way.id,
          osmType: 'way',
          featureId: `way/${way.id}`,
          kind: 'highway',
          highway: way.tags.highway,
          offsetMeters: 0,
          ...highwayProps,
        },
      })
    }

    const sidepaths = expandSidepaths(way.id, way.tags).filter(
      (sidepath) => !isSeparateSidepathValue(sidepath.tags[sidepath.ref.prefix]),
    )
    const prefixesBySide: Record<SidepathSide, SidepathPrefix[]> = { left: [], right: [] }
    for (const sidepath of sidepaths) {
      prefixesBySide[sidepath.ref.side].push(sidepath.ref.prefix)
    }

    for (const sidepath of sidepaths) {
      const sidepathProps = surfacePropertiesFromTags(
        sidepath.tags,
        classifySurfaceInfra(sidepath.tags, { prefix: sidepath.ref.prefix }),
        false,
      )
      const offsetMeters = surfaceSidepathOffsetMeters(
        width.value,
        sidepath.ref.prefix,
        prefixesBySide[sidepath.ref.side],
      )

      features.push({
        type: 'Feature',
        id: formatSidepathFeatureId(sidepath.ref),
        geometry: {
          type: 'LineString',
          coordinates,
        },
        properties: {
          osmId: way.id,
          osmType: 'way',
          featureId: formatSidepathFeatureId(sidepath.ref),
          kind: 'sidepath',
          prefix: sidepath.ref.prefix,
          side: sidepath.ref.side,
          highway: sidepath.tags.highway ?? sidepath.ref.prefix,
          parentRoadWidthM: width.value,
          offsetMeters,
          ...sidepathProps,
        },
      })
    }
  }

  return features
}

export function emptySurfaceCollection(): SurfaceFeatureCollection {
  return { type: 'FeatureCollection', features: [] }
}

export function surfacesToCollection(features: SurfaceFeature[]): SurfaceFeatureCollection {
  return { type: 'FeatureCollection', features }
}
