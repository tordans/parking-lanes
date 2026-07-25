import type { OsmTags } from '@osm-editor-kit/osm-data'
import type { OsmFeatureRef } from '@osm-editor-kit/osm-map-url'
import { expandSidepaths } from '@osm-editor-kit/osm-sidepath-tags'
import { DEFAULT_SURFACE_KEYS, type FieldKeys, withSettLengthKey } from './surface-tag-patches'

export type SurfaceEditLayout =
  | { kind: 'single'; keys: FieldKeys }
  | { kind: 'segregated'; footKeys: FieldKeys; cycleKeys: FieldKeys }
  | { kind: 'cycleway-sides'; leftKeys: FieldKeys; rightKeys: FieldKeys }

export type SurfaceChannelLabel = 'single' | 'foot' | 'cycle' | 'left' | 'right' | 'same'

function footKeysFromTags(tags: OsmTags): FieldKeys {
  if (tags['footway:surface'] != null || tags['footway:smoothness'] != null) {
    return withSettLengthKey({
      surfaceKey: 'footway:surface',
      smoothnessKey: 'footway:smoothness',
    })
  }
  return withSettLengthKey(DEFAULT_SURFACE_KEYS)
}

function cycleKeysFromTags(): FieldKeys {
  return withSettLengthKey({
    surfaceKey: 'cycleway:surface',
    smoothnessKey: 'cycleway:smoothness',
  })
}

function cyclewaySideKeys(side: 'left' | 'right'): FieldKeys {
  return withSettLengthKey({
    surfaceKey: `cycleway:${side}:surface`,
    smoothnessKey: `cycleway:${side}:smoothness`,
    settLengthKey: `cycleway:${side}:sett:length`,
  })
}

function isSegregatedPath(tags: OsmTags): boolean {
  return tags.segregated === 'yes'
}

function hasCyclewaySidepaths(tags: OsmTags, wayId: number): boolean {
  return expandSidepaths(wayId, tags).some((entry) => entry.ref.prefix === 'cycleway')
}

function existsCyclewaySideSurfaceTags(tags: OsmTags, side: 'left' | 'right'): boolean {
  return (
    tags[`cycleway:${side}:surface`] != null ||
    tags[`cycleway:${side}:smoothness`] != null ||
    tags[`cycleway:${side}:sett:length`] != null
  )
}

export function resolveSurfaceEditLayout(
  tags: OsmTags,
  wayId: number,
  selectedRef: OsmFeatureRef,
): SurfaceEditLayout {
  if (isSegregatedPath(tags)) {
    return {
      kind: 'segregated',
      footKeys: footKeysFromTags(tags),
      cycleKeys: cycleKeysFromTags(),
    }
  }

  const isCyclewaySideSelection =
    selectedRef.type === 'way' &&
    selectedRef.prefix === 'cycleway' &&
    (selectedRef.side === 'left' || selectedRef.side === 'right')

  if (isCyclewaySideSelection || hasCyclewaySidepaths(tags, wayId)) {
    return {
      kind: 'cycleway-sides',
      leftKeys: cyclewaySideKeys('left'),
      rightKeys: cyclewaySideKeys('right'),
    }
  }

  return {
    kind: 'single',
    keys: withSettLengthKey(DEFAULT_SURFACE_KEYS),
  }
}

export function readChannelValues(
  tags: OsmTags,
  keys: FieldKeys,
): { surface?: string; smoothness?: string; settLength?: string } {
  const resolved = withSettLengthKey(keys)
  return {
    surface: tags[resolved.surfaceKey],
    smoothness: tags[resolved.smoothnessKey],
    settLength: resolved.settLengthKey ? tags[resolved.settLengthKey] : tags['sett:length'],
  }
}

export function defaultSameMode(layout: SurfaceEditLayout, tags: OsmTags): boolean {
  if (layout.kind === 'segregated') {
    const hasFoot =
      tags[layout.footKeys.surfaceKey] != null ||
      tags[layout.footKeys.smoothnessKey] != null ||
      (layout.footKeys.settLengthKey != null && tags[layout.footKeys.settLengthKey] != null)
    const hasCycle =
      tags[layout.cycleKeys.surfaceKey] != null ||
      tags[layout.cycleKeys.smoothnessKey] != null ||
      (layout.cycleKeys.settLengthKey != null && tags[layout.cycleKeys.settLengthKey] != null)

    if (!hasFoot && !hasCycle) return true

    const foot = readChannelValues(tags, layout.footKeys)
    const cycle = readChannelValues(tags, layout.cycleKeys)
    return foot.surface === cycle.surface && foot.smoothness === cycle.smoothness
  }

  if (layout.kind === 'cycleway-sides') {
    const hasLeft = existsCyclewaySideSurfaceTags(tags, 'left')
    const hasRight = existsCyclewaySideSurfaceTags(tags, 'right')
    if (!hasLeft && !hasRight) return true

    const left = readChannelValues(tags, layout.leftKeys)
    const right = readChannelValues(tags, layout.rightKeys)
    return left.surface === right.surface && left.smoothness === right.smoothness
  }

  return true
}
