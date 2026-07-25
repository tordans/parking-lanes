import type { OsmTags } from '@osm-editor-kit/osm-data'
import {
  DISALLOWED,
  normalizeTaggedSmoothness,
  sanitizeSurface,
} from '@osm-editor-kit/osm-surface-quality'

export type SurfacePaintState = 'missing_surface' | 'missing_smoothness' | 'smoothness'

export function readTaggedSurface(tags: OsmTags): string | undefined {
  if (tags.surface == null) return undefined
  const surface = sanitizeSurface(tags)
  if (surface === DISALLOWED) return undefined
  return surface
}

export function readTaggedSmoothness(tags: OsmTags): string | undefined {
  return normalizeTaggedSmoothness(tags)
}

export function surfacePaintState(tags: OsmTags): SurfacePaintState {
  const surface = readTaggedSurface(tags)
  if (!surface) return 'missing_surface'

  const smoothness = readTaggedSmoothness(tags)
  if (!smoothness) return 'missing_smoothness'

  return 'smoothness'
}
