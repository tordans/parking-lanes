import { parsePositiveInt, parseWidthMeters, splitLanesPipe } from './pipe'
import { isOneway } from './tags'

/** Soft-validation codes for carriageway width vs lane/parking/buffer parts. */
export type WidthWarningCode =
  | 'sum_exceeds_width'
  | 'unexplained_residual'
  | 'pipe_count_mismatch'
  | 'cycleway_width_double_count'
  | 'prefer_width_when_unmarked'

export type WidthReconciliation = {
  /** Carriageway kerb→kerb metres from `width`, else `est_width`. */
  widthM?: number
  widthSource?: 'width' | 'est_width'
  /**
   * Σ clear `width:lanes` pipe values (flowing slots only).
   * `undefined` when no `width:lanes` (or directional) pipes are present —
   * distinct from a present tag whose parsed values sum to 0.
   */
  slotSumM?: number
  /** Count of `width:lanes` pipe tokens that parsed to a positive/zero metre value. */
  taggedSlotCount: number
  /** Σ on-carriageway `parking:*:width` (excludes `street_side` / `separate`). */
  parkingM: number
  /** Σ numeric `cycleway:*:buffer*` (paint already included in buffer). */
  bufferM: number
  /**
   * Optional DE paint estimate: Schmalstrich 0.12 m × counted longitudinal strokes.
   * Stroke count ≈ (pipeCount − 1) separators + up to 2 edge lines. 0 when `lane_markings=no`
   * or when there is nothing to reconcile against (`slotSumM` undefined).
   */
  paintEstimateM: number
  /**
   * widthM − (slotSum + parking + buffer); undefined when widthM is absent
   * **or** when `slotSumM` is undefined (no per-lane widths to reconcile).
   */
  residualM?: number
  warnings: Array<{ code: WidthWarningCode; message: string; detail?: string }>
}

/** DE Schmalstrich (narrow longitudinal marking) — research §2.2. */
const SCHMALSTRICH_M = 0.12

/**
 * Untagged gutter / edge strip allowance before residual is "unexplained"
 * (StreetComplete / research order of magnitude ≈ 0.2–0.5 m).
 */
const PLAUSIBLE_GUTTER_M = 0.5

/** Parking positions that sit on (or partly on) the carriageway. */
const ON_CARRIAGEWAY_PARKING = new Set([
  'lane',
  'half_on_kerb',
  'on_kerb',
  'shoulder',
  'painted_area_only',
])

const OFF_CARRIAGEWAY_PARKING = new Set(['street_side', 'separate', 'no'])

const LANE_PIPE_BASES = [
  'turn:lanes',
  'vehicle:lanes',
  'bicycle:lanes',
  'bus:lanes',
  'psv:lanes',
  'width:lanes',
  'change:lanes',
  'surface:lanes',
  'smoothness:lanes',
] as const

function readWidthSource(tags: Record<string, string>): {
  widthM?: number
  widthSource?: 'width' | 'est_width'
} {
  const width = parseWidthMeters(tags.width)
  if (width != null) return { widthM: width, widthSource: 'width' }
  const est = parseWidthMeters(tags.est_width)
  if (est != null) return { widthM: est, widthSource: 'est_width' }
  return {}
}

/** Collect `width:lanes` (+ directional) tokens without double-counting undirected+directional. */
function collectWidthLaneTokens(tags: Record<string, string>): string[] {
  const undirected = tags['width:lanes']
  if (undirected != null) return splitLanesPipe(undirected)

  const tokens: string[] = []
  for (const key of ['width:lanes:forward', 'width:lanes:both_ways', 'width:lanes:backward']) {
    const value = tags[key]
    if (value != null) tokens.push(...splitLanesPipe(value))
  }
  return tokens
}

function sumWidthLaneSlots(tags: Record<string, string>): {
  slotSumM?: number
  taggedSlotCount: number
  pipeCount: number
} {
  const tokens = collectWidthLaneTokens(tags)
  if (tokens.length === 0) {
    return { slotSumM: undefined, taggedSlotCount: 0, pipeCount: 0 }
  }
  let slotSumM = 0
  let taggedSlotCount = 0
  for (const token of tokens) {
    const meters = parseWidthMeters(token)
    if (meters != null) {
      slotSumM += meters
      taggedSlotCount++
    }
  }
  return { slotSumM, taggedSlotCount, pipeCount: tokens.length }
}

function isOnCarriagewayParking(position: string | undefined): boolean {
  if (position == null || position === '') return false
  const normalized = position.toLowerCase()
  if (OFF_CARRIAGEWAY_PARKING.has(normalized)) return false
  if (ON_CARRIAGEWAY_PARKING.has(normalized)) return true
  // Unknown values: include only when a numeric width is present and not clearly off-carriageway.
  return !normalized.includes('street_side') && !normalized.includes('separate')
}

function sumOnCarriagewayParking(tags: Record<string, string>): number {
  let total = 0
  const sides = ['left', 'right', 'both'] as const
  for (const side of sides) {
    const position = tags[`parking:${side}`]
    if (!isOnCarriagewayParking(position)) continue
    const width = parseWidthMeters(tags[`parking:${side}:width`])
    if (width != null) total += width
  }
  return total
}

/** Sum numeric `cycleway:*:buffer*` keys (Berlin nested buffer:left/right included). */
function sumCyclewayBuffers(tags: Record<string, string>): number {
  let total = 0
  for (const [key, value] of Object.entries(tags)) {
    if (!key.includes('buffer')) continue
    if (!key.startsWith('cycleway:') && key !== 'cycleway:buffer') continue
    // Match cycleway:buffer, cycleway:left:buffer, cycleway:right:buffer:left, …
    if (!/(?:^cycleway:buffer$)|(?:^cycleway:[^:]+:buffer(?:$|:))/.test(key)) continue
    const meters = parseWidthMeters(value)
    if (meters != null) total += meters
  }
  return total
}

/**
 * DE paint estimate: Schmalstrich × (separators + up to two edge lines).
 * Separators = pipeCount − 1; edges assumed present when markings exist.
 * Returns 0 when `lane_markings=no` or there are no width:lanes pipes.
 */
function estimatePaintMeters(tags: Record<string, string>, pipeCount: number): number {
  if (tags.lane_markings?.toLowerCase() === 'no') return 0
  if (pipeCount <= 0) return 0
  const separators = Math.max(0, pipeCount - 1)
  const edgeLines = 2
  return (separators + edgeLines) * SCHMALSTRICH_M
}

function hasBicycleSlotInPipes(tags: Record<string, string>): boolean {
  for (const [key, value] of Object.entries(tags)) {
    if (key !== 'bicycle:lanes' && !key.startsWith('bicycle:lanes:')) continue
    for (const token of splitLanesPipe(value)) {
      const t = token.toLowerCase()
      if (t === 'designated' || t === 'yes') return true
    }
  }
  return false
}

function hasOnCarriagewayCyclewayWidth(tags: Record<string, string>): boolean {
  const cyclewayKeys = Object.keys(tags).filter(
    (key) =>
      key === 'cycleway' ||
      key === 'cycleway:left' ||
      key === 'cycleway:right' ||
      key === 'cycleway:both',
  )
  const onCarriageway = cyclewayKeys.some((key) => {
    const value = tags[key]?.toLowerCase()
    return value === 'lane' || value === 'shared_lane' || value === 'opposite_lane'
  })
  if (!onCarriageway) return false

  for (const [key, value] of Object.entries(tags)) {
    if (key === 'cycleway:width' || /^cycleway:(?:left|right|both):width$/.test(key)) {
      if (parseWidthMeters(value) != null) return true
    }
  }
  return false
}

function widthLanesImpliesBikeSlot(tags: Record<string, string>, pipeCount: number): boolean {
  if (hasBicycleSlotInPipes(tags)) return true
  const motorLanes =
    parsePositiveInt(tags.lanes) ??
    (parsePositiveInt(tags['lanes:forward']) ?? 0) +
      (parsePositiveInt(tags['lanes:backward']) ?? 0) +
      (parsePositiveInt(tags['lanes:both_ways']) ?? 0)
  if (motorLanes > 0 && pipeCount > motorLanes) return true
  return false
}

function checkPipeCountMismatch(
  tags: Record<string, string>,
): { code: WidthWarningCode; message: string; detail?: string } | undefined {
  const oneway = isOneway(tags)
  const directions = oneway
    ? ([''] as const)
    : (['', ':forward', ':backward', ':both_ways'] as const)

  for (const suffix of directions) {
    const lengths: Array<{ name: string; length: number }> = []
    for (const base of LANE_PIPE_BASES) {
      const key = `${base}${suffix}`
      const value = tags[key]
      if (value == null) continue
      const length = splitLanesPipe(value).length
      if (length > 0) lengths.push({ name: key, length })
    }
    if (lengths.length < 2) continue
    const reference = lengths[0]!
    const mismatch = lengths.find((p) => p.length !== reference.length)
    if (mismatch) {
      return {
        code: 'pipe_count_mismatch',
        message: `${reference.name} pipe count (${reference.length}) ≠ ${mismatch.name} (${mismatch.length})`,
        detail: suffix === '' ? 'undirected' : suffix.slice(1),
      }
    }
  }
  return undefined
}

/**
 * Soft-reconcile kerb→kerb `width` / `est_width` against `width:lanes` + on-carriageway
 * parking + numeric cycleway buffers (+ optional DE paint estimate). Never asserts equality.
 */
export function reconcileWidths(tags: Record<string, string>): WidthReconciliation {
  const { widthM, widthSource } = readWidthSource(tags)
  const { slotSumM, taggedSlotCount, pipeCount } = sumWidthLaneSlots(tags)
  const parkingM = sumOnCarriagewayParking(tags)
  const bufferM = sumCyclewayBuffers(tags)
  const paintEstimateM = slotSumM === undefined ? 0 : estimatePaintMeters(tags, pipeCount)

  const hasSlotSum = slotSumM !== undefined
  const partsSum = hasSlotSum ? slotSumM + parkingM + bufferM : undefined
  const residualM = widthM != null && partsSum != null ? widthM - partsSum : undefined

  const warnings: WidthReconciliation['warnings'] = []

  if (tags.lane_markings?.toLowerCase() === 'no' && widthM == null) {
    warnings.push({
      code: 'prefer_width_when_unmarked',
      message:
        'lane_markings=no: prefer tagging width or est_width (do not invent lanes from metres)',
    })
  }

  if (hasSlotSum && widthM != null && partsSum != null && partsSum > widthM + 1e-9) {
    warnings.push({
      code: 'sum_exceeds_width',
      message: `Σ width:lanes + parking + buffer (${partsSum} m) exceeds ${widthSource}=${widthM}`,
      detail: `parts=${partsSum}, width=${widthM}`,
    })
  }

  if (hasSlotSum && residualM != null && residualM > paintEstimateM + PLAUSIBLE_GUTTER_M + 1e-9) {
    warnings.push({
      code: 'unexplained_residual',
      message: `Residual ${residualM.toFixed(2)} m is larger than paint estimate (${paintEstimateM} m) + plausible gutter (${PLAUSIBLE_GUTTER_M} m)`,
      detail: `residual=${residualM}, paintEstimate=${paintEstimateM}`,
    })
  }

  const pipeMismatch = checkPipeCountMismatch(tags)
  if (pipeMismatch) warnings.push(pipeMismatch)

  if (
    hasOnCarriagewayCyclewayWidth(tags) &&
    pipeCount > 0 &&
    widthLanesImpliesBikeSlot(tags, pipeCount)
  ) {
    warnings.push({
      code: 'cycleway_width_double_count',
      message:
        'Bike strip appears both in width:lanes and as cycleway:*:width — pick one primary for sum checks',
    })
  }

  return {
    widthM,
    widthSource,
    slotSumM,
    taggedSlotCount,
    parkingM,
    bufferM,
    paintEstimateM,
    residualM,
    warnings,
  }
}
