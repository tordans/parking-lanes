export type DrivingSide = 'left' | 'right'

/**
 * Infer driving side from way tags. Falls back to `right` (DE/EU default).
 * TODO: respect country defaults from geocoding when tags omit `driving_side`.
 */
export function getDrivingSideFromTags(tags: Record<string, string>): DrivingSide {
  const raw = tags.driving_side?.toLowerCase()
  if (raw === 'left' || raw === 'right') return raw
  return 'right'
}
