import type { OsmTags } from '@osm-editor-kit/osm-data'
import type { CategoryTagPlan, TagPlanEntry } from '@tilda-geo/bicycle-infrastructure'
import {
  planTagsForCategory,
  processBikelanes,
  type BikelaneResult,
} from '@tilda-geo/bicycle-infrastructure'

function formatCategoryLabel(categoryId: string): string {
  return categoryId
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

/**
 * Preferred tags for categories matched only by library macros.
 * `@tilda-geo/bicycle-infrastructure` planTagsForCategory skips macros, so without
 * these hints those targets yield an empty plan and a cryptic `_category` conflict.
 */
const MACRO_CATEGORY_SUGGESTIONS: Record<string, TagPlanEntry[]> = {
  bicycleRoad: [
    {
      key: 'bicycle_road',
      value: 'yes',
      reason: 'Fahrradstraße / bicycle road',
    },
  ],
  bicycleRoad_vehicleDestination: [
    {
      key: 'bicycle_road',
      value: 'yes',
      reason: 'Fahrradstraße / bicycle road',
    },
    {
      key: 'vehicle',
      value: 'destination',
      reason: 'Motor vehicles only for destination traffic (Anlieger frei)',
    },
  ],
  sharedBusLaneBikeWithBus: [
    { key: 'highway', value: 'cycleway', reason: 'Shared bus/bike lane geometry' },
    { key: 'lane', value: 'share_busway', reason: 'Bike shares the bus lane' },
  ],
  sharedBusLaneBusWithBike: [
    { key: 'highway', value: 'cycleway', reason: 'Shared bus/bike lane geometry' },
    { key: 'cycleway', value: 'share_busway', reason: 'Bus lane shared with bikes' },
  ],
  crossing: [
    { key: 'highway', value: 'cycleway', reason: 'Crossing as cycleway' },
    { key: 'cycleway', value: 'crossing', reason: 'Crossing infrastructure' },
  ],
}

const ON_HIGHWAY_CATEGORY_PREFIX = 'cyclewayOnHighway'

function isSidewalkFootway(tags: OsmTags): boolean {
  return (
    tags.highway === 'footway' && (tags.footway === 'sidewalk' || tags['is_sidepath:of'] != null)
  )
}

function isCarriagewayHighway(tags: OsmTags): boolean {
  const highway = tags.highway
  if (highway == null) return false
  return !['footway', 'path', 'cycleway', 'pedestrian', 'steps', 'platform', 'corridor'].includes(
    highway,
  )
}

function mergeSuggestions(
  plan: CategoryTagPlan,
  suggestions: TagPlanEntry[],
  tags: OsmTags,
): CategoryTagPlan {
  const existingKeys = new Set([
    ...plan.add.map((entry) => entry.key),
    ...plan.change.map((entry) => entry.key),
  ])
  const add = [...plan.add]
  const change = [...plan.change]

  for (const suggestion of suggestions) {
    if (existingKeys.has(suggestion.key)) continue
    const current = tags[suggestion.key]
    if (current == null) {
      add.push(suggestion)
      existingKeys.add(suggestion.key)
    } else if (current !== suggestion.value) {
      change.push({
        key: suggestion.key,
        from: current,
        to: suggestion.value,
        reason: suggestion.reason,
      })
      existingKeys.add(suggestion.key)
    }
  }

  return { ...plan, add, change }
}

function categoryAfterPlan(
  tags: OsmTags,
  plan: CategoryTagPlan,
  side: BikelaneResult['_side'],
): string | null {
  const next: OsmTags = { ...tags }
  for (const entry of plan.change) next[entry.key] = entry.to
  for (const entry of plan.add) {
    if (next[entry.key] == null) next[entry.key] = entry.value
  }
  return processBikelanes(next).find((result) => result._side === side)?.category ?? null
}

function unreachableConflict(
  key: string,
  value: string,
  reason: string,
): CategoryTagPlan['conflicts'][number] {
  return { key, value, reason }
}

function explainGeometryMismatch(tags: OsmTags, targetCategoryId: string): string | null {
  const label = formatCategoryLabel(targetCategoryId)

  if (
    (targetCategoryId === 'bicycleRoad' || targetCategoryId === 'bicycleRoad_vehicleDestination') &&
    isSidewalkFootway(tags)
  ) {
    return `${label} is for the carriageway (typically residential with bicycle_road=yes), not a sidewalk footway. For this way, use Footway Bicycle Yes Adjoining / Isolated instead.`
  }

  if (targetCategoryId.startsWith(ON_HIGHWAY_CATEGORY_PREFIX) && !isCarriagewayHighway(tags)) {
    return `${label} is tagged on the road centerline via cycleway:left/right=lane (and optional :lane=exclusive/advisory), not on a separate ${tags.highway ?? 'path'} way.`
  }

  if (
    (targetCategoryId === 'sharedBusLaneBikeWithBus' ||
      targetCategoryId === 'sharedBusLaneBusWithBike') &&
    tags.highway !== 'cycleway' &&
    !isCarriagewayHighway(tags)
  ) {
    return `${label} needs cycleway share_busway tagging (or the matching DE traffic signs) on a cycleway/bus-lane geometry — not a sidewalk footway.`
  }

  if (targetCategoryId === 'crossing' && tags.footway === 'sidewalk') {
    return `${label} needs footway/path/cycleway=crossing (plus bicycle access). This way is tagged footway=sidewalk.`
  }

  if (targetCategoryId === 'pedestrianAreaBicycleYes' && tags.highway !== 'pedestrian') {
    return `${label} requires highway=pedestrian with bicycle=yes|designated.`
  }

  return null
}

function humanizeRemainingConflict(
  plan: CategoryTagPlan,
  resultCategory: string | null,
): CategoryTagPlan['conflicts'] {
  const label = formatCategoryLabel(plan.targetCategoryId)
  const resultLabel = resultCategory
    ? formatCategoryLabel(resultCategory)
    : 'unknown / no bicycle infrastructure'
  const suggested =
    plan.add.length > 0 || plan.change.length > 0
      ? 'The suggested tag edits are not enough to reach that classification.'
      : 'Automatic suggestions cannot derive the tags this category needs yet.'

  return [
    unreachableConflict(
      'category',
      resultCategory ?? 'none',
      `Cannot reach “${label}” (would still be ${resultLabel}). ${suggested}`,
    ),
  ]
}

/**
 * Plan tags for a target category, filling macro-only gaps and replacing cryptic
 * `_category=null` conflicts with actionable explanations.
 */
export function planCategoryForSide(
  tags: OsmTags,
  targetCategoryId: string,
  side: BikelaneResult['_side'],
): CategoryTagPlan {
  const base =
    side === 'self'
      ? planTagsForCategory(tags, targetCategoryId)
      : planTagsForCategory(tags, targetCategoryId, { side })

  if (base.aligned) return base

  const geometryReason = explainGeometryMismatch(tags, targetCategoryId)
  if (geometryReason) {
    return {
      ...base,
      add: [],
      change: [],
      conflicts: [
        unreachableConflict(
          tags.highway ? 'highway' : 'category',
          tags.highway ?? 'none',
          geometryReason,
        ),
      ],
      aligned: false,
    }
  }

  const macroSuggestions = MACRO_CATEGORY_SUGGESTIONS[targetCategoryId]
  const withMacros = macroSuggestions ? mergeSuggestions(base, macroSuggestions, tags) : base
  const resultCategory = categoryAfterPlan(tags, withMacros, side)
  const aligned = resultCategory === targetCategoryId

  if (aligned) {
    return { ...withMacros, aligned: true, conflicts: [] }
  }

  if (
    withMacros.conflicts.length === 0 &&
    withMacros.add.length === 0 &&
    withMacros.change.length === 0
  ) {
    return {
      ...withMacros,
      conflicts: humanizeRemainingConflict(withMacros, resultCategory),
    }
  }

  const hasOpaqueCategoryConflict = withMacros.conflicts.some((entry) => entry.key === '_category')
  if (!hasOpaqueCategoryConflict) return { ...withMacros, aligned: false }

  return {
    ...withMacros,
    aligned: false,
    conflicts: humanizeRemainingConflict(withMacros, resultCategory),
  }
}
