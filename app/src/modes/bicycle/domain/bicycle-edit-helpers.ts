import type { OsmTags, OsmWay } from '@osm-editor-kit/osm-data'
import type { OsmFeatureRef } from '@osm-editor-kit/osm-map-url'
import { expandSidepaths, nestSideTags } from '@osm-editor-kit/osm-sidepath-tags'
import type { CategoryTagPlan } from '@tilda-geo/bicycle-infrastructure'
import {
  analyzeCategoryGaps,
  isIncompleteCategoryId,
  listTargetCategories,
  processBikelanes,
  type BikelaneResult,
} from '@tilda-geo/bicycle-infrastructure'
import { planCategoryForSide } from './bicycle-category-plan'

export type BicycleEditSide = 'left' | 'right' | 'both'

export function formatCategoryLabel(categoryId: string): string {
  return categoryId
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

export function isSidepathRef(ref: OsmFeatureRef): ref is OsmFeatureRef & {
  type: 'way'
  prefix: 'cycleway' | 'sidewalk'
  side: 'left' | 'right'
} {
  return (
    ref.type === 'way' &&
    (ref.prefix === 'cycleway' || ref.prefix === 'sidewalk') &&
    (ref.side === 'left' || ref.side === 'right')
  )
}

export function bikelaneSideFromRef(ref: OsmFeatureRef): BikelaneResult['_side'] {
  if (isSidepathRef(ref)) return ref.side
  return 'self'
}

export function findBikelaneResult(
  tags: OsmTags,
  side: BikelaneResult['_side'],
): BikelaneResult | undefined {
  return processBikelanes(tags).find((result) => result._side === side)
}

export function findGapResult(tags: OsmTags, side: BikelaneResult['_side']) {
  const results = processBikelanes(tags)
  return analyzeCategoryGaps(tags, results).find((gap) => gap._side === side)
}

export function defaultTargetCategory(
  currentCategory: string,
  incomplete: boolean,
  gapUnlocks: string[],
): string | undefined {
  // App sentinel when processBikelanes has no result for this side — not a plan target.
  if (currentCategory === 'unknown') return undefined

  if (!incomplete && !isIncompleteCategoryId(currentCategory)) {
    return currentCategory
  }

  const targets = listTargetCategories({
    fromCategory: currentCategory,
    fromIncomplete: incomplete || isIncompleteCategoryId(currentCategory),
  })

  if (gapUnlocks.length > 0) {
    const unlock = gapUnlocks.find((id) => targets.includes(id))
    if (unlock) return unlock
  }

  if (currentCategory === 'needsClarification') return undefined
  return targets[0]
}

export function planForSide(
  tags: OsmTags,
  targetCategoryId: string,
  side: BikelaneResult['_side'],
): CategoryTagPlan {
  return planCategoryForSide(tags, targetCategoryId, side)
}

export function applyCategoryPlan(tags: OsmTags, plan: CategoryTagPlan): OsmTags {
  const next: OsmTags = { ...tags }
  for (const change of plan.change) {
    next[change.key] = change.to
  }
  for (const add of plan.add) {
    if (next[add.key] == null) next[add.key] = add.value
  }
  return next
}

export function sidepathTagsForRef(way: OsmWay, ref: OsmFeatureRef): OsmTags | undefined {
  if (!isSidepathRef(ref)) return undefined
  return expandSidepaths(way.id, way.tags).find(
    (entry) => entry.ref.prefix === ref.prefix && entry.ref.side === ref.side,
  )?.tags
}

export function stageBicycleTagsOnWay(way: OsmWay, tags: OsmTags): OsmWay {
  return { ...way, tags }
}

export function stageBicyclePatchOnSidepath(
  way: OsmWay,
  prefix: 'cycleway' | 'sidewalk',
  side: 'left' | 'right',
  patch: Record<string, string | undefined>,
): OsmWay {
  return { ...way, tags: nestSideTags(way.tags, prefix, side, patch) }
}

export function commitFlatTagEdit(
  way: OsmWay,
  ref: OsmFeatureRef,
  key: string,
  value: string | undefined,
): OsmWay {
  if (isSidepathRef(ref)) {
    const patch: Record<string, string | undefined> = { [key]: value || undefined }
    return stageBicyclePatchOnSidepath(way, ref.prefix, ref.side, patch)
  }

  const nextTags = { ...way.tags }
  if (value) nextTags[key] = value
  else delete nextTags[key]
  return stageBicycleTagsOnWay(way, nextTags)
}

export function centerlinePresenceKey(base: 'cycleway' | 'bicycle', side: BicycleEditSide): string {
  if (side === 'both') return `${base}:both`
  return `${base}:${side}`
}
