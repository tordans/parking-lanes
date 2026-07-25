import type { OsmTags } from '@osm-editor-kit/osm-data'
import {
  deriveHighwayWidthFallback,
  isOnewayFromOsmTags,
  type HighwayWidthFallbackSource,
} from './highway-width-fallbacks'

export type RoadWidthConfidence = 'high' | 'medium'
export type RoadWidthExplicitSource = 'width' | 'est_width'
export type RoadWidthSource = RoadWidthExplicitSource | HighwayWidthFallbackSource
export type RoadWidthKind = 'explicit' | 'default'

export type RoadWidthFromTags = {
  value: number
  confidence: RoadWidthConfidence
  source: RoadWidthSource
  kind: RoadWidthKind
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

function explicitWidthFromTags(tags: OsmTags): Omit<RoadWidthFromTags, 'kind'> | null {
  if (tags.width) {
    const parsed = parseOsmWidth(tags.width)
    if (parsed != null) {
      return { value: parsed, confidence: 'high', source: 'width' }
    }
  }

  if (tags.est_width) {
    const parsed = parseOsmWidth(tags.est_width)
    if (parsed != null) {
      return { value: parsed, confidence: 'high', source: 'est_width' }
    }
  }

  return null
}

/** Tag width / est_width first, else highway fallback — mirrors tilda-geo-cqi `road_width_tags.lua`. */
export function roadWidthFromTags(tags: OsmTags): RoadWidthFromTags {
  const explicit = explicitWidthFromTags(tags)
  if (explicit) {
    return { ...explicit, kind: 'explicit' }
  }

  const fallback = deriveHighwayWidthFallback(tags.highway, isOnewayFromOsmTags(tags))
  return {
    value: fallback.value,
    confidence: 'medium',
    source: fallback.source,
    kind: 'default',
  }
}
