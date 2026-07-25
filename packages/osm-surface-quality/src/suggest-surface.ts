import { parseLength } from './helpers/parse-length.ts'
import {
  isAllowedOsmSurface,
  isSettFamilySurface,
  sanitizeSurface,
  settLengthForSize,
} from './sanitize-surface.ts'
/** Parent-highway surface suggestion for side-attached infra. */
import type { OsmTags } from './types.ts'
import { DISALLOWED } from './types.ts'

export type SurfaceSuggestion = {
  surface: string
  settLength?: number
}

/** OSM-safe parent `surface=*` suggestion when present and allowed. */
export function suggestSurfaceFromParent(parentTags: OsmTags): SurfaceSuggestion | undefined {
  const rawSurface = parentTags.surface
  if (rawSurface == null) return undefined

  if (isAllowedOsmSurface(rawSurface)) {
    if (rawSurface === 'sett') {
      const settLength = parseLength(parentTags['sett:length'])
      return settLength != null ? { surface: 'sett', settLength } : { surface: 'sett' }
    }
    return { surface: rawSurface }
  }

  const sanitized = sanitizeSurface(parentTags)
  if (sanitized == null || sanitized === DISALLOWED) return undefined

  if (isSettFamilySurface(sanitized)) {
    return { surface: 'sett', settLength: settLengthForSize(sanitized) }
  }

  return { surface: sanitized }
}
