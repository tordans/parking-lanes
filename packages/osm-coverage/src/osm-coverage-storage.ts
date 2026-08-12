import type { ParsedOsmData } from '@osm-editor-kit/osm-data'
import type { Feature, MultiPolygon, Polygon } from 'geojson'

/** Durable session blob — fetchHistory stays memory-only. */
export type OsmCoveragePersisted = {
  graph: ParsedOsmData
  coverage: Feature<Polygon | MultiPolygon> | null
  savedAt: string
}

export type OsmCoverageStorage = {
  load(sessionKey: readonly unknown[]): Promise<OsmCoveragePersisted | null>
  save(sessionKey: readonly unknown[], data: OsmCoveragePersisted): Promise<void>
  clear(sessionKey: readonly unknown[]): Promise<void>
}

/** ISO `savedAt` from session query data, or null when never persisted/fetched. */
export function getCoverageSavedAt(savedAt: string | null | undefined): string | null {
  if (!savedAt) return null
  const parsed = Date.parse(savedAt)
  return Number.isNaN(parsed) ? null : savedAt
}

/**
 * Round `savedAt` down to the hour for UI (“OSM data from 14:00”).
 * Returns null when missing/invalid.
 */
export function formatCoverageAgeHour(
  savedAt: string | null | undefined,
  now: Date = new Date(),
): string | null {
  const iso = getCoverageSavedAt(savedAt)
  if (!iso) return null

  const saved = new Date(iso)
  saved.setMinutes(0, 0, 0)

  const hour = String(saved.getHours()).padStart(2, '0')
  const sameDay =
    saved.getFullYear() === now.getFullYear() &&
    saved.getMonth() === now.getMonth() &&
    saved.getDate() === now.getDate()

  if (sameDay) {
    return `${hour}:00`
  }

  const y = saved.getFullYear()
  const m = String(saved.getMonth() + 1).padStart(2, '0')
  const d = String(saved.getDate()).padStart(2, '0')
  return `${y}-${m}-${d} ${hour}:00`
}
