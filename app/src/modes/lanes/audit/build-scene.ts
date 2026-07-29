import {
  buildRoadSpaceSegment,
  layoutRoadSpace,
  type RoadSpaceScene,
  type RoadSpaceSegmentRole,
} from '@osm-editor-kit/osm-lane-diagram'

export type SegmentTagsInput = {
  role: RoadSpaceSegmentRole
  wayId: number
  tags: Record<string, string>
}

/** Build a layout scene from oriented prev/current/next tag maps. */
export function sceneFromSegmentTags(segments: readonly SegmentTagsInput[]): RoadSpaceScene {
  return layoutRoadSpace({
    segments: segments.map((seg) =>
      buildRoadSpaceSegment(seg.tags, { wayId: seg.wayId, role: seg.role }),
    ),
  })
}

/** Parse `key=value` lines into a tag map (blank lines and `#` comments ignored). */
export function parseTagLines(text: string): Record<string, string> {
  const tags: Record<string, string> = {}
  for (const raw of text.split('\n')) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq <= 0) continue
    const key = line.slice(0, eq).trim()
    const value = line.slice(eq + 1).trim()
    if (key) tags[key] = value
  }
  return tags
}

export function formatTagLines(tags: Record<string, string>): string {
  return Object.entries(tags)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n')
}
