export type { OsmTags } from './types.ts'
export { DISALLOWED } from './types.ts'
export {
  classifySettSize,
  isAllowedOsmSurface,
  isSettFamilySurface,
  sanitizeSurface,
  settLengthForSize,
  settSizeFromLength,
  type SettSize,
} from './sanitize-surface.ts'
export {
  deriveSmoothness,
  normalizeTaggedSmoothness,
  suggestSmoothnessFromSurface,
  type SmoothnessResult,
} from './derive-smoothness.ts'
export { suggestSurfaceFromParent, type SurfaceSuggestion } from './suggest-surface.ts'
