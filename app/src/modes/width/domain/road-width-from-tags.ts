import type { OsmTags } from '@osm-editor-kit/osm-data'
import {
  deriveHighwayWidthFallback,
  isOnewayHighway,
  type HighwayWidthFallbackSource,
} from './highway-width-fallbacks'

export type RoadWidthConfidence = 'high' | 'medium'
export type RoadWidthSource = 'tag' | HighwayWidthFallbackSource

export type RoadWidthFromTags = {
  value: number
  confidence: RoadWidthConfidence
  source: RoadWidthSource
}

/** Parse OSM width tag (m / cm / km) into metres. */
export function parseOsmWidth(width: string): number | null {
  const trimmed = width.trim()
  const match = trimmed.match(/^([+-]?(?:\d+\.?\d*|\.\d+))\s*([a-zA-Z]*)$/)
  if (!match) return null

  const value = Number.parseFloat(match[1]!)
  if (!Number.isFinite(value)) return null

  const unit = (match[2] || 'm').toLowerCase()
  if (unit === 'm') return value
  if (unit === 'cm') return value / 100
  if (unit === 'km') return value * 1000
  return null
}

/** Tag width first, else highway fallback — mirrors tilda-geo-cqi `road_width_tags.lua`. */
export function roadWidthFromTags(tags: OsmTags): RoadWidthFromTags {
  if (tags.width) {
    const parsed = parseOsmWidth(tags.width)
    if (parsed != null) {
      return {
        value: parsed,
        confidence: 'high',
        source: 'tag',
      }
    }
  }

  const fallback = deriveHighwayWidthFallback(tags.highway, isOnewayHighway(tags.oneway))
  return {
    value: fallback.value,
    confidence: 'medium',
    source: fallback.source,
  }
}
