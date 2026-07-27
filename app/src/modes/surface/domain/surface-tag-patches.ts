import { getSmoothnessOptionsForSurface } from '@osm-editor-kit/surface-smoothness-data'

export interface FieldKeys {
  surfaceKey: string
  smoothnessKey: string
  settLengthKey?: string
}

export const DEFAULT_SURFACE_KEYS: FieldKeys = {
  surfaceKey: 'surface',
  smoothnessKey: 'smoothness',
  settLengthKey: 'sett:length',
}

export type TagPatch = Record<string, string | undefined>

export function withSettLengthKey(keys: FieldKeys): FieldKeys {
  if (keys.settLengthKey) return keys
  const base = keys.surfaceKey.replace(/:surface$/, '')
  return {
    ...keys,
    settLengthKey: base && base !== 'surface' ? `${base}:sett:length` : 'sett:length',
  }
}

export function smoothnessValuesForSurface(surface: string | undefined): string[] {
  if (!surface) return []
  return getSmoothnessOptionsForSurface(surface).map((option) => option.smoothness)
}

export function isSmoothnessValidForSurface(
  surface: string | undefined,
  smoothness: string | undefined,
): boolean {
  if (!smoothness) return true
  return smoothnessValuesForSurface(surface).includes(smoothness)
}

/** Setting the surface: write it, and clear smoothness if it is no longer offered. */
export function surfaceChangePatch(
  currentSmoothness: string | undefined,
  nextSurface: string | undefined,
  keys: FieldKeys = DEFAULT_SURFACE_KEYS,
): TagPatch {
  const resolved = withSettLengthKey(keys)
  const patch: TagPatch = { [resolved.surfaceKey]: nextSurface || undefined }
  if (!isSmoothnessValidForSurface(nextSurface, currentSmoothness)) {
    patch[resolved.smoothnessKey] = undefined
  }
  if (nextSurface !== 'sett') {
    patch[resolved.settLengthKey!] = undefined
  }
  return patch
}

/** Setting (or clearing) the smoothness value. */
export function smoothnessChangePatch(
  nextSmoothness: string | undefined,
  keys: FieldKeys = DEFAULT_SURFACE_KEYS,
): TagPatch {
  const resolved = withSettLengthKey(keys)
  return { [resolved.smoothnessKey]: nextSmoothness || undefined }
}

export function settSizeChangePatch(
  size: 'mosaic_sett' | 'small_sett' | 'large_sett',
  keys: FieldKeys = DEFAULT_SURFACE_KEYS,
  settLengthForSize: (size: 'mosaic_sett' | 'small_sett' | 'large_sett') => number,
): TagPatch {
  const resolved = withSettLengthKey(keys)
  return {
    [resolved.surfaceKey]: 'sett',
    [resolved.settLengthKey!]: String(settLengthForSize(size)),
  }
}
