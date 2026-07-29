import { tildaGeoBase } from '../hosts'
import {
  serializeTildaFeaturesParam,
  type TildaFeatureCoord,
  type TildaFeatureParam,
} from './features-param'
import { tildaSourceNumericId } from './sources'

export type TildaInfra = 'bikelanes' | 'parking'

export type TildaInfraPreset = {
  regionSlug: string
  sourceId: string
  /** Layer visibility config; drifts in TILDA — override per call if needed. */
  defaultConfig: string
}

/**
 * Infra → public TILDA region presets.
 * Roads (width/surface/lanes) have no public region — omit those callers.
 */
export const TILDA_INFRA_PRESETS: Record<TildaInfra, TildaInfraPreset> = {
  bikelanes: {
    regionSlug: 'radinfra',
    sourceId: 'atlas_bikelanes',
    defaultConfig: '1v92rco.7h39.4pt3i8',
  },
  parking: {
    regionSlug: 'parkraum',
    sourceId: 'lars_parking',
    defaultConfig: '12nl2cs.16lxxh',
  },
}

export type TildaMapPosition = {
  zoom: number
  lat: number
  lng: number
}

export type TildaInspectorUrlOptions = {
  regionSlug: string
  map: TildaMapPosition
  config?: string
  features?: TildaFeatureParam | TildaFeatureParam[]
  version?: number
  baseUrl?: string
}

/** Full TILDA region inspector deeplink (`map` + optional `config` + `f` + `v`). */
export function tildaInspectorUrl(options: TildaInspectorUrlOptions): string {
  const base = options.baseUrl ?? tildaGeoBase
  const url = new URL(`${base}/regionen/${options.regionSlug}`)
  const { zoom, lat, lng } = options.map
  url.searchParams.set('map', `${zoom}/${lat}/${lng}`)
  if (options.config) url.searchParams.set('config', options.config)
  if (options.features) {
    const f = serializeTildaFeaturesParam(options.features)
    if (f) url.searchParams.set('f', f)
  }
  url.searchParams.set('v', String(options.version ?? 2))
  return url.toString()
}

export type TildaInspectorForInfraOptions = {
  map: TildaMapPosition
  /** Required for feature-level `f`; omit for viewport-only links. */
  featureId?: string | number
  coords?: TildaFeatureCoord
  config?: string
  version?: number
  baseUrl?: string
}

/**
 * Build inspector URL for a known infra preset.
 * Returns viewport-only URL when `featureId`/`coords` are omitted.
 * Returns `null` only when map position is incomplete (should not happen with typed input).
 */
export function tildaInspectorUrlForInfra(
  infra: TildaInfra,
  options: TildaInspectorForInfraOptions,
): string {
  const preset = TILDA_INFRA_PRESETS[infra]
  const features =
    options.featureId != null && options.coords != null
      ? {
          sourceId: preset.sourceId,
          featureId: options.featureId,
          coords: options.coords,
        }
      : undefined

  return tildaInspectorUrl({
    regionSlug: preset.regionSlug,
    map: options.map,
    config: options.config ?? preset.defaultConfig,
    features,
    version: options.version,
    baseUrl: options.baseUrl,
  })
}

export function tildaInfraSourceNumericId(infra: TildaInfra): number | undefined {
  return tildaSourceNumericId(TILDA_INFRA_PRESETS[infra].sourceId)
}
