import { tildaSourceNumericId } from './sources'

export type TildaFeatureCoord =
  | { kind: 'point'; lon: number; lat: number }
  | { kind: 'bbox'; minLon: number; minLat: number; maxLon: number; maxLat: number }

export type TildaFeatureParam = {
  /** TILDA source name (e.g. `atlas_bikelanes`) or numeric id. */
  sourceId: string | number
  /** Feature id: `way/123` or numeric Lars id. */
  featureId: string | number
  coords: TildaFeatureCoord
}

const COORD_PRECISION = 6

function roundCoord(n: number): string {
  const factor = 10 ** COORD_PRECISION
  return String(Math.round(n * factor) / factor)
}

function resolveNumericSourceId(sourceId: string | number): number | undefined {
  if (typeof sourceId === 'number') return sourceId
  if (/^\d+$/.test(sourceId)) return Number(sourceId)
  return tildaSourceNumericId(sourceId)
}

function serializeOneFeature(feature: TildaFeatureParam): string | undefined {
  const numericId = resolveNumericSourceId(feature.sourceId)
  if (numericId == null) return undefined

  const id = String(feature.featureId)
  if (feature.coords.kind === 'point') {
    const { lon, lat } = feature.coords
    return `${numericId}|${id}|${roundCoord(lon)}|${roundCoord(lat)}`
  }
  const { minLon, minLat, maxLon, maxLat } = feature.coords
  return `${numericId}|${id}|${roundCoord(minLon)}|${roundCoord(minLat)}|${roundCoord(maxLon)}|${roundCoord(maxLat)}`
}

/** Build TILDA `f` query value from one or more features. */
export function serializeTildaFeaturesParam(
  features: TildaFeatureParam | TildaFeatureParam[],
): string | undefined {
  const list = Array.isArray(features) ? features : [features]
  const parts = list.map(serializeOneFeature).filter((p): p is string => p != null)
  if (parts.length === 0) return undefined
  return parts.join(',')
}
