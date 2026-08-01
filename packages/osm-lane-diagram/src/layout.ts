import {
  DEFAULT_MEDIAN_GAP_M,
  DEFAULT_METERS_TO_PX,
  SEGMENT_BAND_HEIGHT_PX,
  SEGMENT_GAP_PX,
  TAPER_FRAC,
  TRANSITION_BAND_HEIGHT_FRAC,
} from './defaults'
import { collectPlacementIssues } from './placement'
import { buildCarriagewayPlate, buildCorridorRibbons } from './ribbons'
import type {
  RoadSpaceChain,
  RoadSpaceScene,
  RoadSpaceSegment,
  RoadSpaceSlot,
  ScenePolyline,
  SceneSegmentBand,
  SceneSlotRect,
} from './types'

const PADDING_PX = 16
/** Slight vertical overlap between band rects to avoid hairline gaps from sub-pixel rounding. */
const SEAM_OVERLAP_PX = 1
const EPS = 0.01
/** Near-equal X positions merge into one separator run (px). */
const SEPARATOR_X_TOLERANCE_PX = 2

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

type BandGeometry = {
  segment: RoadSpaceSegment
  y: number
  height: number
  /** Left edge x of each real slot (same order as segment.slots). */
  slotLeftX: number[]
  /** Left edge x of each opposite-branch slot (fork.siblingSlots order). */
  siblingSlotLeftX?: number[]
  centrelineX: number
  leftOuterX: number
  rightOuterX: number
  leftKerbX: number
  rightKerbX: number
  /** Left/right envelope including sibling placeholder (dual spreading). */
  leftSpreadOuterX: number
  rightSpreadOuterX: number
  /** Facing edges of the median gap (absent when no fork). */
  medianLeftX?: number
  medianRightX?: number
  /** Opposite-branch footprint (real sibling stack or gray placeholder). */
  placeholder?: { x: number; width: number }
}

/** Width of the dimmed opposite branch: real sibling slots, else mirrored placeholder. */
function siblingStackWidthM(fork: NonNullable<RoadSpaceSegment['fork']>): number {
  if (fork.siblingSlots && fork.siblingSlots.length > 0) {
    return fork.siblingSlots.reduce((sum, s) => sum + s.widthM, 0)
  }
  return fork.placeholderWidthM != null && fork.placeholderWidthM > 0 ? fork.placeholderWidthM : 0
}

function forkGapM(fork: RoadSpaceSegment['fork'] | undefined): number {
  if (!fork) return 0
  return fork.gapM > 0 ? fork.gapM : DEFAULT_MEDIAN_GAP_M
}

function stackWidthM(slots: RoadSpaceSlot[], fork?: RoadSpaceSegment['fork']): number {
  const sum = slots.reduce((s, slot) => s + slot.widthM, 0)
  if (!fork) return sum
  return sum + forkGapM(fork) + siblingStackWidthM(fork)
}

/**
 * Metric left edge of each slot within the full LTR stack (sibling + gap included).
 */
function slotStartsM(segment: RoadSpaceSegment): number[] {
  const { slots, fork } = segment
  const starts: number[] = []
  let x = 0

  if (fork?.dimmedSide === 'left' && siblingStackWidthM(fork) > 0) {
    x = siblingStackWidthM(fork) + forkGapM(fork)
  }

  const leftSet = new Set(fork?.leftSlotIds ?? [])
  const rightSet = new Set(fork?.rightSlotIds ?? [])
  const gapM = forkGapM(fork)
  let gapInserted = fork?.dimmedSide === 'left' && siblingStackWidthM(fork) > 0

  for (const slot of slots) {
    if (fork && !gapInserted && leftSet.size > 0 && rightSet.has(slot.id) && starts.length > 0) {
      const prevSlot = slots[starts.length - 1]!
      if (leftSet.has(prevSlot.id)) {
        x += gapM
        gapInserted = true
      }
    }
    starts.push(x)
    x += slot.widthM
  }

  return starts
}

function buildBandGeometry(
  segment: RoadSpaceSegment,
  y: number,
  height: number,
  centrelineX: number,
  metersToPx: number,
): BandGeometry {
  const starts = slotStartsM(segment)
  const stackLeftX = round2(centrelineX - segment.centrelineOffsetM * metersToPx)
  const slotLeftX = starts.map((s) => round2(stackLeftX + s * metersToPx))

  const fork = segment.fork
  let placeholder: BandGeometry['placeholder']
  let siblingSlotLeftX: number[] | undefined
  let medianLeftX: number | undefined
  let medianRightX: number | undefined

  if (fork && siblingStackWidthM(fork) > 0 && fork.dimmedSide === 'left') {
    const pw = siblingStackWidthM(fork) * metersToPx
    const gap = forkGapM(fork) * metersToPx
    placeholder = { x: stackLeftX, width: round2(pw) }
    medianLeftX = round2(stackLeftX + pw)
    medianRightX = round2(stackLeftX + pw + gap)
    if (fork.siblingSlots && fork.siblingSlots.length > 0) {
      siblingSlotLeftX = []
      let sx = stackLeftX
      for (const slot of fork.siblingSlots) {
        siblingSlotLeftX.push(round2(sx))
        sx += slot.widthM * metersToPx
      }
    }
  } else if (fork && siblingStackWidthM(fork) > 0 && fork.dimmedSide === 'right') {
    const slotsWidthM = segment.slots.reduce((s, slot) => s + slot.widthM, 0)
    const pw = siblingStackWidthM(fork) * metersToPx
    const gap = forkGapM(fork) * metersToPx
    const gapLeft = round2(stackLeftX + slotsWidthM * metersToPx)
    medianLeftX = gapLeft
    medianRightX = round2(gapLeft + gap)
    placeholder = { x: medianRightX, width: round2(pw) }
    if (fork.siblingSlots && fork.siblingSlots.length > 0) {
      siblingSlotLeftX = []
      let sx = medianRightX
      for (const slot of fork.siblingSlots) {
        siblingSlotLeftX.push(round2(sx))
        sx += slot.widthM * metersToPx
      }
    }
  } else if (fork && fork.leftSlotIds.length > 0 && fork.rightSlotIds.length > 0) {
    const leftSet = new Set(fork.leftSlotIds)
    const rightSet = new Set(fork.rightSlotIds)
    let leftRightM = 0
    for (let i = 0; i < segment.slots.length; i++) {
      const slot = segment.slots[i]!
      if (leftSet.has(slot.id)) {
        leftRightM = Math.max(leftRightM, starts[i]! + slot.widthM)
      }
    }
    let rightLeftM = Infinity
    for (let i = 0; i < segment.slots.length; i++) {
      const slot = segment.slots[i]!
      if (rightSet.has(slot.id)) {
        rightLeftM = Math.min(rightLeftM, starts[i]!)
      }
    }
    if (Number.isFinite(rightLeftM)) {
      medianLeftX = round2(stackLeftX + leftRightM * metersToPx)
      medianRightX = round2(stackLeftX + rightLeftM * metersToPx)
    }
  }

  // Outer edges: full stack including sidepaths + placeholder
  const totalM = stackWidthM(segment.slots, fork)
  const leftOuterX = stackLeftX
  const rightOuterX = round2(stackLeftX + totalM * metersToPx)

  // Kerbs: carriageway boundaries (exclude sidepaths). For dual forks, kerbs bound
  // the *travel* carriageway only — placeholder is a sibling block, not the left kerb.
  let leftKerbX = leftOuterX
  let rightKerbX = rightOuterX

  const carriagewayIndices = segment.slots
    .map((slot, i) => (slot.zone === 'carriageway' ? i : -1))
    .filter((i) => i >= 0)

  if (carriagewayIndices.length > 0) {
    const firstCw = carriagewayIndices[0]!
    const lastCw = carriagewayIndices[carriagewayIndices.length - 1]!
    const cwLeft = slotLeftX[firstCw]!
    const cwRight = round2(slotLeftX[lastCw]! + segment.slots[lastCw]!.widthM * metersToPx)
    leftKerbX = cwLeft
    rightKerbX = cwRight
  } else if (placeholder) {
    leftKerbX = placeholder.x
    rightKerbX = round2(placeholder.x + placeholder.width)
  }

  // Spreading footprint (placeholder outer) — used for outer-edge runs that must
  // not be merged across dual ↔ non-dual boundaries.
  let leftSpreadOuterX = leftOuterX
  let rightSpreadOuterX = rightOuterX
  if (placeholder && fork?.dimmedSide === 'left') {
    leftSpreadOuterX = placeholder.x
  } else if (placeholder && fork?.dimmedSide === 'right') {
    rightSpreadOuterX = round2(placeholder.x + placeholder.width)
  }

  return {
    segment,
    y,
    height,
    slotLeftX,
    siblingSlotLeftX,
    centrelineX,
    leftOuterX,
    rightOuterX,
    leftKerbX,
    rightKerbX,
    leftSpreadOuterX,
    rightSpreadOuterX,
    medianLeftX,
    medianRightX,
    placeholder,
  }
}

function differs(a: number, b: number): boolean {
  return Math.abs(a - b) > EPS
}

function rectVerticalExtent(
  bandIndex: number,
  bandCount: number,
  y: number,
  height: number,
): { y: number; height: number } {
  let top = y
  let h = height
  if (bandIndex > 0) {
    top -= SEAM_OVERLAP_PX / 2
    h += SEAM_OVERLAP_PX / 2
  }
  if (bandIndex < bandCount - 1) {
    h += SEAM_OVERLAP_PX / 2
  }
  return { y: round2(top), height: round2(h) }
}

function dedupePoints(points: Array<{ x: number; y: number }>): Array<{ x: number; y: number }> {
  const out: Array<{ x: number; y: number }> = []
  for (const p of points) {
    const prev = out[out.length - 1]
    if (prev && Math.abs(prev.x - p.x) < EPS && Math.abs(prev.y - p.y) < EPS) continue
    out.push(p)
  }
  return out
}

/**
 * One continuous vertical run across contiguous bands.
 * True width changes → diagonal on the wider band (lane merge/split).
 * Pure lateral shifts (same total width, different offset) → square step at the
 * boundary — diagonals on both sides look like a sheared road, not a taper.
 */
function appendContinuousVerticalRun(
  points: Array<{ x: number; y: number }>,
  bandXs: Array<{
    y: number
    height: number
    x: number
    width?: number
    synthetic?: boolean
  }>,
  side: 'left' | 'right',
): void {
  if (bandXs.length === 0) return

  const isWider = (a: number, b: number) => (side === 'right' ? a > b + EPS : a < b - EPS)
  const widthChanged = (a: { width?: number }, b: { width?: number }): boolean => {
    if (a.width == null || b.width == null) return true
    return differs(a.width, b.width)
  }

  for (let i = 0; i < bandXs.length; i++) {
    const band = bandXs[i]!
    const topY = round2(band.y)
    const botY = round2(band.y + band.height)
    const x = band.x
    const prev = bandXs[i - 1]
    const next = bandXs[i + 1]

    if (band.synthetic) {
      const topX = prev && !prev.synthetic ? prev.x : x
      const botX = next && !next.synthetic ? next.x : x
      if (!prev) points.push({ x: topX, y: topY })
      else if (!prev.synthetic) points.push({ x: prev.x, y: topY })
      points.push({ x: botX, y: botY })
      continue
    }

    if (!prev) {
      points.push({ x, y: topY })
    } else if (prev.synthetic) {
      points.push({ x, y: topY })
    } else if (differs(prev.x, x)) {
      if (!widthChanged(prev, band)) {
        // Pure shift — square step at the shared boundary.
        points.push({ x: prev.x, y: topY })
        points.push({ x, y: topY })
      } else if (isWider(x, prev.x)) {
        const taperY = round2(band.y + band.height * TAPER_FRAC)
        points.push({ x: prev.x, y: topY })
        points.push({ x, y: taperY })
      } else {
        points.push({ x, y: topY })
      }
    }

    if (!next) {
      points.push({ x, y: botY })
    } else if (next.synthetic) {
      points.push({ x, y: botY })
    } else if (differs(next.x, x)) {
      if (!widthChanged(band, next)) {
        points.push({ x, y: botY })
      } else if (isWider(x, next.x)) {
        const taperY = round2(band.y + band.height * (1 - TAPER_FRAC))
        points.push({ x, y: taperY })
        points.push({ x: next.x, y: botY })
      } else {
        points.push({ x, y: botY })
      }
    }
  }
}

/** Leftmost / rightmost travel-or-sidepath slot of a band (excludes placeholder/median). */
function outermostSlot(
  band: BandGeometry,
  side: 'left' | 'right',
): RoadSpaceSegment['slots'][number] | undefined {
  const slots = band.segment.slots
  if (slots.length === 0) return undefined
  return side === 'left' ? slots[0] : slots[slots.length - 1]
}

function sameForkPresence(a: BandGeometry, b: BandGeometry): boolean {
  return (a.segment.fork != null) === (b.segment.fork != null)
}

function bandOuterX(band: BandGeometry, side: 'left' | 'right'): number {
  return side === 'left' ? band.leftOuterX : band.rightOuterX
}

function bandOuterWidth(band: BandGeometry): number {
  return round2(band.rightOuterX - band.leftOuterX)
}

function carriagewayKerbWidth(band: BandGeometry): number {
  return round2(band.rightKerbX - band.leftKerbX)
}

function bandDrivingLaneCount(band: BandGeometry): number {
  return band.segment.slots.filter(
    (s) =>
      s.zone === 'carriageway' &&
      (s.kind === 'motor' || s.kind === 'bus') &&
      s.direction !== 'none',
  ).length
}

function needsTransitionBand(a: BandGeometry, b: BandGeometry): boolean {
  if (a.segment.synthetic || b.segment.synthetic) return false
  if ((a.segment.fork != null) !== (b.segment.fork != null)) return false
  if (differs(carriagewayKerbWidth(a), carriagewayKerbWidth(b))) return true
  if (bandDrivingLaneCount(a) !== bandDrivingLaneCount(b)) return true
  return false
}

function transitionBandHeightPx(
  a: BandGeometry,
  b: BandGeometry,
  bandHeight: number,
  metersToPx: number,
): number {
  const widthDeltaPx = Math.abs(carriagewayKerbWidth(a) - carriagewayKerbWidth(b))
  const minFrac = TRANSITION_BAND_HEIGHT_FRAC * 0.85
  const maxFrac = TRANSITION_BAND_HEIGHT_FRAC * 1.15
  const slopeBoost = widthDeltaPx / (bandHeight * metersToPx * 0.4)
  const frac = Math.min(maxFrac, Math.max(minFrac, minFrac + slopeBoost * 0.12))
  return round2(bandHeight * frac)
}

function buildSyntheticTransitionBand(
  above: BandGeometry,
  below: BandGeometry,
  y: number,
  height: number,
  centrelineX: number,
): BandGeometry {
  const segment: RoadSpaceSegment = {
    wayId: 0,
    role: above.segment.role,
    synthetic: true,
    slots: [],
    centrelineOffsetM: below.segment.centrelineOffsetM,
    placement: below.segment.placement,
    laneMarkings: false,
  }
  return {
    segment,
    y: round2(y),
    height: round2(height),
    slotLeftX: [],
    centrelineX,
    leftOuterX: below.leftOuterX,
    rightOuterX: below.rightOuterX,
    leftKerbX: below.leftKerbX,
    rightKerbX: below.rightKerbX,
    leftSpreadOuterX: below.leftSpreadOuterX,
    rightSpreadOuterX: below.rightSpreadOuterX,
    medianLeftX: below.medianLeftX,
    medianRightX: below.medianRightX,
    placeholder: below.placeholder,
  }
}

function insertTransitionBands(
  bands: BandGeometry[],
  bandHeight: number,
  centrelineX: number,
  metersToPx: number,
  gap: number,
): BandGeometry[] {
  if (bands.length === 0) return bands
  const result: BandGeometry[] = []
  let y = bands[0]!.y
  for (let i = 0; i < bands.length; i++) {
    const band = bands[i]!
    if (i > 0) {
      const prev = result[result.length - 1]!
      if (needsTransitionBand(prev, band)) {
        const tHeight = transitionBandHeightPx(prev, band, bandHeight, metersToPx)
        result.push(buildSyntheticTransitionBand(prev, band, y, tHeight, centrelineX))
        y += tHeight + gap
      }
    }
    result.push({ ...band, y: round2(y) })
    y += band.height + gap
  }
  return result
}

/**
 * Reshape slots along a taper so coloured pavement follows the kerb/outer edge:
 * - carriageway slot against the kerb (e.g. new turn pocket) becomes a triangle/trapezoid
 * - outermost sidepath, when outside the kerb, tapers on the outer face
 * Pure placement shifts (same total width) are left as rectangles.
 */
function reshapeOuterSlotsForTapers(slotRects: SceneSlotRect[], bands: BandGeometry[]): void {
  for (let i = 0; i < bands.length; i++) {
    const band = bands[i]!
    if (band.segment.synthetic) continue
    const prev = bands[i - 1]
    const next = bands[i + 1]
    const bandW = bandOuterWidth(band)

    for (const side of ['left', 'right'] as const) {
      const kerbX = side === 'left' ? band.leftKerbX : band.rightKerbX
      const outerX = bandOuterX(band, side)

      type EdgeSpec = {
        slot: RoadSpaceSegment['slots'][number]
        fullOuter: number
        topFrom?: number
        bottomTo?: number
      }
      const specs: EdgeSpec[] = []

      const cwIdxs = band.segment.slots
        .map((s, idx) => (s.zone === 'carriageway' ? idx : -1))
        .filter((idx) => idx >= 0)
      if (cwIdxs.length > 0) {
        const cwEdgeIdx = side === 'right' ? cwIdxs[cwIdxs.length - 1]! : cwIdxs[0]!
        const cwSlot = band.segment.slots[cwEdgeIdx]!
        let topFrom: number | undefined
        let bottomTo: number | undefined
        if (
          prev &&
          !prev.segment.synthetic &&
          sameForkPresence(prev, band) &&
          differs(bandOuterWidth(prev), bandW)
        ) {
          const prevKerb = side === 'left' ? prev.leftKerbX : prev.rightKerbX
          if (differs(prevKerb, kerbX)) {
            const grew = side === 'right' ? kerbX > prevKerb + EPS : kerbX < prevKerb - EPS
            if (grew) topFrom = prevKerb
          }
        }
        if (
          next &&
          !next.segment.synthetic &&
          sameForkPresence(band, next) &&
          differs(bandW, bandOuterWidth(next))
        ) {
          const nextKerb = side === 'left' ? next.leftKerbX : next.rightKerbX
          if (differs(nextKerb, kerbX)) {
            const widerThanNext = side === 'right' ? kerbX > nextKerb + EPS : kerbX < nextKerb - EPS
            if (widerThanNext) bottomTo = nextKerb
          }
        }
        if (topFrom != null || bottomTo != null) {
          specs.push({ slot: cwSlot, fullOuter: kerbX, topFrom, bottomTo })
        }
      }

      const outerSlot = outermostSlot(band, side)
      if (outerSlot && (!specs[0] || specs[0].slot.id !== outerSlot.id)) {
        let topFrom: number | undefined
        let bottomTo: number | undefined
        if (
          prev &&
          !prev.segment.synthetic &&
          sameForkPresence(prev, band) &&
          differs(bandOuterWidth(prev), bandW)
        ) {
          const prevOuter = bandOuterX(prev, side)
          if (differs(prevOuter, outerX)) {
            const grew = side === 'right' ? outerX > prevOuter + EPS : outerX < prevOuter - EPS
            if (grew) topFrom = prevOuter
          }
        }
        if (
          next &&
          !next.segment.synthetic &&
          sameForkPresence(band, next) &&
          differs(bandW, bandOuterWidth(next))
        ) {
          const nextOuter = bandOuterX(next, side)
          if (differs(nextOuter, outerX)) {
            const widerThanNext =
              side === 'right' ? outerX > nextOuter + EPS : outerX < nextOuter - EPS
            if (widerThanNext) bottomTo = nextOuter
          }
        }
        if (topFrom != null || bottomTo != null) {
          specs.push({ slot: outerSlot, fullOuter: outerX, topFrom, bottomTo })
        }
      }

      for (const spec of specs) {
        const rect = slotRects.find(
          (r) => r.slotId === spec.slot.id && r.role === band.segment.role,
        )
        if (!rect || rect.label === 'step_fill') continue

        const innerX = side === 'right' ? rect.x : rect.x + rect.width
        const fullOuterX = spec.fullOuter
        const clampOuter = (o: number) =>
          side === 'right' ? Math.max(o, innerX) : Math.min(o, innerX)

        const topY = round2(band.y)
        const botY = round2(band.y + band.height)
        const topTaperY = round2(band.y + band.height * TAPER_FRAC)
        const botTaperY = round2(band.y + band.height * (1 - TAPER_FRAC))

        const points: Array<{ x: number; y: number }> = []
        points.push({ x: round2(innerX), y: topY })
        if (spec.topFrom != null) {
          points.push({ x: round2(clampOuter(spec.topFrom)), y: topY })
          points.push({ x: round2(fullOuterX), y: topTaperY })
        } else {
          points.push({ x: round2(fullOuterX), y: topY })
        }
        if (spec.bottomTo != null) {
          points.push({ x: round2(fullOuterX), y: botTaperY })
          points.push({ x: round2(clampOuter(spec.bottomTo)), y: botY })
        } else {
          points.push({ x: round2(fullOuterX), y: botY })
        }
        points.push({ x: round2(innerX), y: botY })
        rect.points = dedupePoints(points)
      }
    }
  }
}

/**
 * When a kerb grows into the arriving band, the trapezoid pocket sits *inside*
 * the diagonal; the small exterior wedge under the top edge (old sidepath /
 * shoulder) would otherwise stay white. Fill it with the departing outer slot.
 */
function appendExteriorTaperWedges(slotRects: SceneSlotRect[], bands: BandGeometry[]): void {
  for (let i = 0; i < bands.length - 1; i++) {
    const a = bands[i]!
    const b = bands[i + 1]!
    if (a.segment.synthetic || b.segment.synthetic) continue
    if (!sameForkPresence(a, b)) continue
    if (!differs(bandOuterWidth(a), bandOuterWidth(b))) continue

    for (const side of ['left', 'right'] as const) {
      const aKerb = side === 'left' ? a.leftKerbX : a.rightKerbX
      const bKerb = side === 'left' ? b.leftKerbX : b.rightKerbX
      if (!differs(aKerb, bKerb)) continue

      const bGrew = side === 'right' ? bKerb > aKerb + EPS : bKerb < aKerb - EPS
      if (bGrew) {
        const source = outermostSlot(a, side)
        if (!source) continue
        const topY = round2(b.y)
        const taperY = round2(b.y + b.height * TAPER_FRAC)
        const points = [
          { x: round2(aKerb), y: topY },
          { x: round2(bKerb), y: topY },
          { x: round2(bKerb), y: taperY },
        ]
        pushWedge(slotRects, b, source, side, i, points)
        continue
      }

      const aWider = side === 'right' ? aKerb > bKerb + EPS : aKerb < bKerb - EPS
      if (!aWider) continue
      const source = outermostSlot(a, side)
      if (!source) continue
      // Departing wider — exterior wedge in departing band's bottom taper zone.
      const botY = round2(a.y + a.height)
      const taperY = round2(a.y + a.height * (1 - TAPER_FRAC))
      const points = [
        { x: round2(aKerb), y: taperY },
        { x: round2(aKerb), y: botY },
        { x: round2(bKerb), y: botY },
      ]
      pushWedge(slotRects, a, source, side, i, points)
    }
  }
}

function pushWedge(
  slotRects: SceneSlotRect[],
  band: BandGeometry,
  source: RoadSpaceSegment['slots'][number],
  side: 'left' | 'right',
  seamIndex: number,
  points: Array<{ x: number; y: number }>,
): void {
  const xs = points.map((p) => p.x)
  const ys = points.map((p) => p.y)
  slotRects.push({
    slotId: `way/${band.segment.wayId}/step-fill/${side}/${seamIndex}`,
    wayId: band.segment.wayId,
    role: band.segment.role,
    kind: source.kind,
    zone: source.zone,
    direction: 'none',
    x: round2(Math.min(...xs)),
    y: round2(Math.min(...ys)),
    width: round2(Math.max(...xs) - Math.min(...xs)),
    height: round2(Math.max(...ys) - Math.min(...ys)),
    widthProvenance: 'inferred',
    label: 'step_fill',
    dimmed: band.segment.role !== 'current' || undefined,
    points,
  })
}

/**
 * When a dual oneway (left dimmed / median) meets a wider non-dual neighbour,
 * forward pockets that sit over the median (e.g. left-turn) taper to the dual
 * travel hinge so the single dual lane visually splits into turn + through.
 */
function reshapeMedianPocketTapers(
  slotRects: SceneSlotRect[],
  bands: BandGeometry[],
): MedianPocketSeam[] {
  const seams: MedianPocketSeam[] = []
  for (let i = 0; i < bands.length - 1; i++) {
    const a = bands[i]!
    const b = bands[i + 1]!
    const aFork = a.segment.fork != null
    const bFork = b.segment.fork != null
    if (aFork === bFork) continue

    const dual = aFork ? a : b
    const plain = aFork ? b : a
    if (dual.segment.fork?.dimmedSide !== 'left') continue
    if (dual.medianLeftX == null || dual.medianRightX == null) continue

    const hingeX = dual.leftKerbX
    const medianLeft = dual.medianLeftX ?? hingeX
    const plainIsAbove = plain === a

    const pockets = slotRects.filter((r) => {
      if (r.role !== plain.segment.role || r.wayId !== plain.segment.wayId) return false
      if (r.zone !== 'carriageway' || r.kind === 'median') return false
      if (r.label === 'sibling' || r.label === 'step_fill') return false
      // Dual travel is oneway forward — only forward/both_ways (or tagged turn)
      // pockets grow into the median, not opposing traffic.
      if (r.direction !== 'forward' && r.direction !== 'both_ways' && r.turn == null) {
        return false
      }
      const right = r.x + r.width
      if (r.x >= hingeX - EPS) return false
      const abutsHinge = Math.abs(right - hingeX) <= 4
      const overlap = Math.min(right, hingeX) - Math.max(r.x, medianLeft)
      const overlapsMedian = overlap > Math.max(8, r.width * 0.15)
      return abutsHinge || overlapsMedian
    })
    if (pockets.length === 0) continue

    const pocketLeft = Math.min(...pockets.map((r) => r.x))
    // Always taper to the dual travel hinge (continuing carriageway face).
    const tipX = hingeX

    for (const rect of pockets) {
      const left = round2(rect.x)
      const right = round2(rect.x + rect.width)
      const topY = round2(plain.y)
      const botY = round2(plain.y + plain.height)
      if (plainIsAbove) {
        // Wide at top, tapers to hinge at bottom — trapezoid, not sharp tip.
        const taperY = round2(plain.y + plain.height * (1 - TAPER_FRAC))
        rect.points = dedupePoints([
          { x: left, y: topY },
          { x: right, y: topY },
          { x: tipX, y: taperY },
          { x: tipX, y: botY },
        ])
      } else {
        const taperY = round2(plain.y + plain.height * TAPER_FRAC)
        rect.points = dedupePoints([
          { x: tipX, y: topY },
          { x: tipX, y: taperY },
          { x: right, y: botY },
          { x: left, y: botY },
        ])
      }
    }

    // Pavement wedge into the dual median so the split reads across the gap.
    const sourceKind = pockets[0]!.kind
    const sourceZone = pockets[0]!.zone
    const dualTop = round2(dual.y)
    const dualBot = round2(dual.y + dual.height)
    const wedgePoints = plainIsAbove
      ? [
          { x: round2(pocketLeft), y: dualTop },
          { x: round2(tipX), y: dualTop },
          { x: round2(tipX), y: round2(dual.y + dual.height * TAPER_FRAC) },
          { x: round2(pocketLeft), y: round2(dual.y + dual.height * TAPER_FRAC) },
        ]
      : [
          { x: round2(pocketLeft), y: round2(dual.y + dual.height * (1 - TAPER_FRAC)) },
          { x: round2(tipX), y: round2(dual.y + dual.height * (1 - TAPER_FRAC)) },
          { x: round2(tipX), y: dualBot },
          { x: round2(pocketLeft), y: dualBot },
        ]
    slotRects.push({
      slotId: `way/${dual.segment.wayId}/median-pocket-fill/${i}`,
      wayId: dual.segment.wayId,
      role: dual.segment.role,
      kind: sourceKind,
      zone: sourceZone,
      direction: 'none',
      x: round2(Math.min(pocketLeft, tipX)),
      y: round2(Math.min(...wedgePoints.map((p) => p.y))),
      width: round2(Math.abs(tipX - pocketLeft)),
      height: round2(
        Math.max(...wedgePoints.map((p) => p.y)) - Math.min(...wedgePoints.map((p) => p.y)),
      ),
      widthProvenance: 'inferred',
      label: 'step_fill',
      dimmed: dual.segment.role !== 'current' || undefined,
      points: wedgePoints,
    })

    seams.push({
      seamIndex: i,
      plainIsAbove,
      dual,
      plain,
      pocketLeft: round2(pocketLeft),
      tipX: round2(tipX),
    })
  }
  return seams
}

type MedianPocketSeam = {
  seamIndex: number
  plainIsAbove: boolean
  dual: BandGeometry
  plain: BandGeometry
  pocketLeft: number
  tipX: number
}

/**
 * Split a non-dual neighbour into backward vs forward carriageway halves
 * (opposing-traffic boundary). Used to park a dual's sibling / travel stacks
 * on the continuing lanes instead of stretching a void across the median.
 */
function neighborDirectionSplit(
  band: BandGeometry,
  metersToPx: number,
): {
  leftKerb: number
  rightKerb: number
  /** Right edge of the last backward carriageway slot (or mid if none). */
  backwardRight: number
  /** Left edge of the first forward/both_ways carriageway slot (or mid if none). */
  forwardLeft: number
} {
  const mid = round2((band.leftKerbX + band.rightKerbX) / 2)
  let backwardRight = band.leftKerbX
  let forwardLeft = band.rightKerbX
  let foundBack = false
  let foundFwd = false

  for (let i = 0; i < band.segment.slots.length; i++) {
    const slot = band.segment.slots[i]!
    if (slot.zone !== 'carriageway') continue
    const left = band.slotLeftX[i]!
    const right = round2(left + slot.widthM * metersToPx)
    if (slot.direction === 'backward') {
      backwardRight = foundBack ? Math.max(backwardRight, right) : right
      foundBack = true
    }
    if (slot.direction === 'forward' || slot.direction === 'both_ways') {
      forwardLeft = foundFwd ? Math.min(forwardLeft, left) : left
      foundFwd = true
    }
  }

  if (!foundBack && !foundFwd) {
    return {
      leftKerb: band.leftKerbX,
      rightKerb: band.rightKerbX,
      backwardRight: mid,
      forwardLeft: mid,
    }
  }
  if (!foundBack) {
    return {
      leftKerb: band.leftKerbX,
      rightKerb: band.rightKerbX,
      backwardRight: forwardLeft,
      forwardLeft,
    }
  }
  if (!foundFwd) {
    return {
      leftKerb: band.leftKerbX,
      rightKerb: band.rightKerbX,
      backwardRight,
      forwardLeft: backwardRight,
    }
  }

  return {
    leftKerb: band.leftKerbX,
    rightKerb: band.rightKerbX,
    backwardRight: round2(backwardRight),
    forwardLeft: round2(forwardLeft),
  }
}

/**
 * When a dual oneway band meets a non-dual neighbour, left-align the opposite
 * branch to the neighbour's left kerb and right-align travel to the right kerb.
 * The median fills the residual gap (≈0 on a plain bidirectional; ≈left-turn
 * pocket width when one sits between the halves) instead of stretching a void.
 *
 * If this dual also continues into another dual band, keep the tagged median
 * width and only shift the rigid sibling+median+travel block.
 */
function realignDualBandsToNeighbors(bands: BandGeometry[], metersToPx: number): void {
  for (let i = 0; i < bands.length; i++) {
    const dual = bands[i]!
    const fork = dual.segment.fork
    if (!fork || !dual.placeholder) continue
    if (fork.dimmedSide !== 'left' && fork.dimmedSide !== 'right') continue

    const neighbors = [bands[i - 1], bands[i + 1]].filter(
      (b): b is BandGeometry => b != null && b.segment.fork == null,
    )
    if (neighbors.length === 0) continue

    const neighbor = neighbors.reduce((best, n) => {
      const dualEdge = fork.dimmedSide === 'left' ? dual.rightKerbX : dual.leftKerbX
      const bestEdge = fork.dimmedSide === 'left' ? best.rightKerbX : best.leftKerbX
      const nEdge = fork.dimmedSide === 'left' ? n.rightKerbX : n.leftKerbX
      return Math.abs(nEdge - dualEdge) < Math.abs(bestEdge - dualEdge) ? n : best
    })

    const travelWidth = round2(dual.rightKerbX - dual.leftKerbX)
    if (travelWidth <= EPS) continue

    const siblingWidth = dual.placeholder.width
    const split = neighborDirectionSplit(neighbor, metersToPx)
    const keepMedianIsland = [bands[i - 1], bands[i + 1]].some(
      (b) => b != null && b.segment.fork != null,
    )
    const gapPx =
      dual.medianLeftX != null && dual.medianRightX != null
        ? round2(dual.medianRightX - dual.medianLeftX)
        : round2(forkGapM(fork) * metersToPx)

    const applyLeftDimmed = (
      newTravelLeft: number,
      newTravelRight: number,
      newSiblingLeft: number,
      newSiblingRight: number,
      newMedianLeft: number,
      newMedianRight: number,
    ) => {
      const travelDelta = round2(newTravelLeft - dual.leftKerbX)
      dual.slotLeftX = dual.slotLeftX.map((x) => round2(x + travelDelta))
      if (dual.siblingSlotLeftX && fork.siblingSlots && fork.siblingSlots.length > 0) {
        let sx = newSiblingLeft
        dual.siblingSlotLeftX = fork.siblingSlots.map((slot) => {
          const left = round2(sx)
          sx += slot.widthM * metersToPx
          return left
        })
      }
      dual.leftKerbX = newTravelLeft
      dual.rightKerbX = newTravelRight
      dual.placeholder = {
        x: newSiblingLeft,
        width: round2(Math.max(siblingWidth, newSiblingRight - newSiblingLeft)),
      }
      dual.medianLeftX = newMedianLeft
      dual.medianRightX = newMedianRight
      dual.leftOuterX = newSiblingLeft
      dual.leftSpreadOuterX = newSiblingLeft
      dual.rightOuterX = round2(
        Math.max(
          newTravelRight,
          ...dual.segment.slots.map((s, idx) => dual.slotLeftX[idx]! + s.widthM * metersToPx),
        ),
      )
      dual.rightSpreadOuterX = dual.rightOuterX
      dual.centrelineX = round2((newTravelLeft + newTravelRight) / 2)
    }

    const applyRightDimmed = (
      newTravelLeft: number,
      newTravelRight: number,
      newSiblingLeft: number,
      newSiblingRight: number,
      newMedianLeft: number,
      newMedianRight: number,
    ) => {
      const travelDelta = round2(newTravelLeft - dual.leftKerbX)
      dual.slotLeftX = dual.slotLeftX.map((x) => round2(x + travelDelta))
      if (dual.siblingSlotLeftX && fork.siblingSlots && fork.siblingSlots.length > 0) {
        let sx = newSiblingLeft
        dual.siblingSlotLeftX = fork.siblingSlots.map((slot) => {
          const left = round2(sx)
          sx += slot.widthM * metersToPx
          return left
        })
      }
      dual.leftKerbX = newTravelLeft
      dual.rightKerbX = newTravelRight
      dual.placeholder = {
        x: newSiblingLeft,
        width: round2(Math.max(siblingWidth, newSiblingRight - newSiblingLeft)),
      }
      dual.medianLeftX = newMedianLeft
      dual.medianRightX = newMedianRight
      dual.leftOuterX = round2(Math.min(newTravelLeft, ...dual.slotLeftX))
      dual.leftSpreadOuterX = dual.leftOuterX
      dual.rightOuterX = newSiblingRight
      dual.rightSpreadOuterX = newSiblingRight
      dual.centrelineX = round2((newTravelLeft + newTravelRight) / 2)
    }

    if (fork.dimmedSide === 'left') {
      if (keepMedianIsland) {
        const newTravelRight = split.rightKerb
        const newTravelLeft = round2(newTravelRight - travelWidth)
        const newMedianRight = newTravelLeft
        const newMedianLeft = round2(newMedianRight - gapPx)
        const newSiblingRight = newMedianLeft
        const newSiblingLeft = round2(newSiblingRight - siblingWidth)
        applyLeftDimmed(
          newTravelLeft,
          newTravelRight,
          newSiblingLeft,
          newSiblingRight,
          newMedianLeft,
          newMedianRight,
        )
        continue
      }

      let newTravelRight = split.rightKerb
      let newTravelLeft = round2(newTravelRight - travelWidth)
      let newSiblingLeft = split.leftKerb
      let newSiblingRight = round2(newSiblingLeft + siblingWidth)
      let newMedianLeft = newSiblingRight
      let newMedianRight = newTravelLeft
      if (newMedianRight < newMedianLeft - EPS) {
        const seam = newTravelLeft
        newMedianLeft = seam
        newMedianRight = seam
        newSiblingRight = seam
        newSiblingLeft = round2(seam - siblingWidth)
      }
      applyLeftDimmed(
        newTravelLeft,
        newTravelRight,
        newSiblingLeft,
        newSiblingRight,
        newMedianLeft,
        newMedianRight,
      )
    } else {
      if (keepMedianIsland) {
        const newTravelLeft = split.leftKerb
        const newTravelRight = round2(newTravelLeft + travelWidth)
        const newMedianLeft = newTravelRight
        const newMedianRight = round2(newMedianLeft + gapPx)
        const newSiblingLeft = newMedianRight
        const newSiblingRight = round2(newSiblingLeft + siblingWidth)
        applyRightDimmed(
          newTravelLeft,
          newTravelRight,
          newSiblingLeft,
          newSiblingRight,
          newMedianLeft,
          newMedianRight,
        )
        continue
      }

      let newTravelLeft = split.leftKerb
      let newTravelRight = round2(newTravelLeft + travelWidth)
      let newSiblingRight = split.rightKerb
      let newSiblingLeft = round2(newSiblingRight - siblingWidth)
      let newMedianLeft = newTravelRight
      let newMedianRight = newSiblingLeft
      if (newMedianRight < newMedianLeft - EPS) {
        const seam = newTravelRight
        newMedianLeft = seam
        newMedianRight = seam
        newSiblingLeft = seam
        newSiblingRight = round2(seam + siblingWidth)
      }
      applyRightDimmed(
        newTravelLeft,
        newTravelRight,
        newSiblingLeft,
        newSiblingRight,
        newMedianLeft,
        newMedianRight,
      )
    }
  }
}

function emitVerticalPolyline(
  polylines: ScenePolyline[],
  id: string,
  kind: ScenePolyline['kind'],
  style: ScenePolyline['style'],
  bandXs: Array<{ y: number; height: number; x: number; width?: number }>,
  side: 'left' | 'right' = 'right',
): void {
  if (bandXs.length === 0) return
  const points: Array<{ x: number; y: number }> = []
  appendContinuousVerticalRun(points, bandXs, side)
  const deduped = dedupePoints(points)
  if (deduped.length < 2) return
  polylines.push({ id, kind, style, points: deduped })
}

/**
 * Merge per-band x positions into contiguous runs, but never across a dual ↔
 * non-dual boundary when `breakOnForkChange` is set (avoids diagonals through
 * placeholder / median).
 */
function emitMergedVerticalRuns(
  polylines: ScenePolyline[],
  idPrefix: string,
  kind: ScenePolyline['kind'],
  style: ScenePolyline['style'],
  perBandXs: number[][],
  bands: BandGeometry[],
  options?: { breakOnForkChange?: boolean },
): void {
  const rounded = perBandXs.map((xs) => xs.map((x) => round2(x)))
  const canonicalXs: number[] = []
  for (const xs of rounded) {
    for (const x of xs) {
      const existing = canonicalXs.find((c) => Math.abs(c - x) < SEPARATOR_X_TOLERANCE_PX)
      if (!existing) canonicalXs.push(x)
    }
  }

  const hasFork = (i: number) => bands[i]!.segment.fork != null

  let runIdx = 0
  for (const x of canonicalXs.sort((a, b) => a - b)) {
    let i = 0
    while (i < bands.length) {
      if (!rounded[i]!.some((v) => Math.abs(v - x) < SEPARATOR_X_TOLERANCE_PX)) {
        i++
        continue
      }
      const start = i
      i++
      while (
        i < bands.length &&
        rounded[i]!.some((v) => Math.abs(v - x) < SEPARATOR_X_TOLERANCE_PX)
      ) {
        if (options?.breakOnForkChange && hasFork(i) !== hasFork(i - 1)) break
        i++
      }
      const slice = bands.slice(start, i).map((b) => ({
        y: b.y,
        height: b.height,
        x: rounded[start]!.find((v) => Math.abs(v - x) < SEPARATOR_X_TOLERANCE_PX) ?? x,
      }))
      emitVerticalPolyline(polylines, `${idPrefix}-${runIdx++}`, kind, style, slice)
    }
  }
}

/**
 * Layout a prev/current/next (or any ordered) chain into a JSON scene.
 * Segments share one metre scale and align on the OSM centreline.
 */
export function layoutRoadSpace(
  chain: RoadSpaceChain,
  options?: { metersToPx?: number; bandHeightPx?: number },
): RoadSpaceScene {
  const metersToPx = options?.metersToPx ?? DEFAULT_METERS_TO_PX
  const bandHeight = options?.bandHeightPx ?? SEGMENT_BAND_HEIGHT_PX
  const gap = SEGMENT_GAP_PX
  const segments = chain.segments

  if (segments.length === 0) {
    return {
      widthPx: PADDING_PX * 2,
      heightPx: PADDING_PX * 2,
      metersToPx,
      bands: [],
      ribbons: [],
      slotRects: [],
      polylines: [],
    }
  }

  const maxLeftOverhang = Math.max(...segments.map((s) => s.centrelineOffsetM * metersToPx))
  const centrelineX = round2(PADDING_PX + maxLeftOverhang)

  const bands: BandGeometry[] = []
  let y = PADDING_PX
  for (const segment of segments) {
    bands.push(buildBandGeometry(segment, y, bandHeight, centrelineX, metersToPx))
    y += bandHeight + gap
  }
  realignDualBandsToNeighbors(bands, metersToPx)
  const layoutBands = insertTransitionBands(bands, bandHeight, centrelineX, metersToPx, gap)

  // Crop asymmetric centreline overhang so the road stack sits with equal side padding.
  {
    let minX = Infinity
    let maxX = -Infinity
    for (const b of layoutBands) {
      minX = Math.min(minX, b.leftOuterX, b.leftSpreadOuterX)
      maxX = Math.max(maxX, b.rightOuterX, b.rightSpreadOuterX)
      if (b.placeholder) {
        minX = Math.min(minX, b.placeholder.x)
        maxX = Math.max(maxX, b.placeholder.x + b.placeholder.width)
      }
    }
    if (Number.isFinite(minX) && Number.isFinite(maxX)) {
      const dx = round2(PADDING_PX - minX)
      if (Math.abs(dx) > EPS) {
        for (const b of layoutBands) {
          b.slotLeftX = b.slotLeftX.map((x) => round2(x + dx))
          if (b.siblingSlotLeftX) {
            b.siblingSlotLeftX = b.siblingSlotLeftX.map((x) => round2(x + dx))
          }
          b.centrelineX = round2(b.centrelineX + dx)
          b.leftOuterX = round2(b.leftOuterX + dx)
          b.rightOuterX = round2(b.rightOuterX + dx)
          b.leftKerbX = round2(b.leftKerbX + dx)
          b.rightKerbX = round2(b.rightKerbX + dx)
          b.leftSpreadOuterX = round2(b.leftSpreadOuterX + dx)
          b.rightSpreadOuterX = round2(b.rightSpreadOuterX + dx)
          if (b.medianLeftX != null) b.medianLeftX = round2(b.medianLeftX + dx)
          if (b.medianRightX != null) b.medianRightX = round2(b.medianRightX + dx)
          if (b.placeholder) {
            b.placeholder = { x: round2(b.placeholder.x + dx), width: b.placeholder.width }
          }
        }
      }
    }
  }

  const lastLayoutBand = layoutBands[layoutBands.length - 1]!
  const heightPx = round2(lastLayoutBand.y + lastLayoutBand.height + PADDING_PX)
  const maxRightX = Math.max(
    ...layoutBands.map((b) => Math.max(b.rightOuterX, b.rightSpreadOuterX)),
  )
  const minLeftX = Math.min(...layoutBands.map((b) => Math.min(b.leftOuterX, b.leftSpreadOuterX)))
  const widthPx = round2(maxRightX - minLeftX + PADDING_PX * 2)
  const placementGuideX = round2(layoutBands[0]!.centrelineX)

  const sceneBands: SceneSegmentBand[] = layoutBands.map((b) => ({
    wayId: b.segment.wayId,
    role: b.segment.role,
    y: round2(b.y),
    height: round2(b.height),
    dimmed: b.segment.synthetic ? true : b.segment.role !== 'current',
    ...(b.segment.synthetic ? { synthetic: true } : {}),
  }))

  const slotRects: SceneSlotRect[] = []
  for (let bandIndex = 0; bandIndex < layoutBands.length; bandIndex++) {
    const band = layoutBands[bandIndex]!
    if (band.segment.synthetic) continue
    const extent = rectVerticalExtent(bandIndex, layoutBands.length, band.y, band.height)
    const dimmedBand = band.segment.role !== 'current'
    const fork = band.segment.fork
    const leftSet = new Set(fork?.leftSlotIds ?? [])
    const rightSet = new Set(fork?.rightSlotIds ?? [])

    // Opposite dual branch: real sibling slots, or a gray width-mirrored placeholder.
    const siblingSlots = fork?.siblingSlots
    if (siblingSlots && siblingSlots.length > 0 && band.siblingSlotLeftX) {
      for (let si = 0; si < siblingSlots.length; si++) {
        const slot = siblingSlots[si]!
        slotRects.push({
          slotId: slot.id,
          wayId: fork?.siblingWayId ?? band.segment.wayId,
          role: band.segment.role,
          kind: slot.kind,
          zone: slot.zone,
          direction: slot.direction,
          x: band.siblingSlotLeftX[si]!,
          y: extent.y,
          width: round2(slot.widthM * metersToPx),
          height: extent.height,
          widthProvenance: slot.widthProvenance,
          label: slot.label,
          turn: slot.turn,
          dimmed: true,
        })
      }
    } else if (band.placeholder) {
      slotRects.push({
        slotId: `way/${band.segment.wayId}/fork/placeholder`,
        wayId: band.segment.wayId,
        role: band.segment.role,
        kind: 'motor',
        zone: 'carriageway',
        direction: 'none',
        x: band.placeholder.x,
        y: extent.y,
        width: band.placeholder.width,
        height: extent.height,
        widthProvenance: 'inferred',
        label: 'sibling',
        dimmed: true,
      })
    }

    // Explicit median island rect (non-travel), only on dual bands.
    if (
      band.medianLeftX != null &&
      band.medianRightX != null &&
      band.medianRightX - band.medianLeftX > EPS
    ) {
      slotRects.push({
        slotId: `way/${band.segment.wayId}/fork/median`,
        wayId: band.segment.wayId,
        role: band.segment.role,
        kind: 'median',
        zone: 'carriageway',
        direction: 'none',
        x: band.medianLeftX,
        y: extent.y,
        width: round2(band.medianRightX - band.medianLeftX),
        height: extent.height,
        widthProvenance: 'inferred',
        label: 'median',
        medianHint: fork?.medianHint ?? 'verge',
        dimmed: dimmedBand || undefined,
      })
    }

    for (let i = 0; i < band.segment.slots.length; i++) {
      const slot = band.segment.slots[i]!
      // Match ribbon dimming: only dual opposite-branch slots, not prev/next bands.
      let dimmed = false
      if (fork?.dimmedSide === 'left' && leftSet.has(slot.id)) dimmed = true
      if (fork?.dimmedSide === 'right' && rightSet.has(slot.id)) dimmed = true

      slotRects.push({
        slotId: slot.id,
        wayId: band.segment.wayId,
        role: band.segment.role,
        kind: slot.kind,
        zone: slot.zone,
        direction: slot.direction,
        x: band.slotLeftX[i]!,
        y: extent.y,
        width: round2(slot.widthM * metersToPx),
        height: extent.height,
        widthProvenance: slot.widthProvenance,
        label: slot.label,
        turn: slot.turn,
        dimmed: dimmed || undefined,
      })
    }
  }

  reshapeOuterSlotsForTapers(slotRects, layoutBands)
  appendExteriorTaperWedges(slotRects, layoutBands)
  const medianPocketSeams = reshapeMedianPocketTapers(slotRects, layoutBands)

  const extentForBand = (bandIndex: number) =>
    rectVerticalExtent(
      bandIndex,
      layoutBands.length,
      layoutBands[bandIndex]!.y,
      layoutBands[bandIndex]!.height,
    )
  const ribbons = buildCorridorRibbons(layoutBands, metersToPx, extentForBand)
  const carriagewayPlate = buildCarriagewayPlate(layoutBands, ribbons)

  // Ribbons own pavement fills — drop exterior kerb wedges that leave misaligned gray shards.
  // Keep median-pocket fills (different slotId prefix).
  if (ribbons.length > 0) {
    for (let i = slotRects.length - 1; i >= 0; i--) {
      const r = slotRects[i]!
      if (r.label === 'step_fill' && r.slotId.includes('/step-fill/')) slotRects.splice(i, 1)
    }
  }

  const polylines: ScenePolyline[] = []

  // Butt-end caps at the two ends of the whole chain (outer edges)
  const first = layoutBands[0]!
  const last = lastLayoutBand
  polylines.push({
    id: `butt-top-${first.segment.wayId}`,
    kind: 'kerb',
    style: 'solid',
    points: [
      { x: first.leftOuterX, y: round2(first.y) },
      { x: first.rightOuterX, y: round2(first.y) },
    ],
  })
  polylines.push({
    id: `butt-bottom-${last.segment.wayId}`,
    kind: 'kerb',
    style: 'solid',
    points: [
      { x: last.leftOuterX, y: round2(last.y + last.height) },
      { x: last.rightOuterX, y: round2(last.y + last.height) },
    ],
  })

  // Segment-boundary hairlines at real segment interiors (not synthetic wedges).
  for (let i = 0; i < layoutBands.length - 1; i++) {
    const a = layoutBands[i]!
    const b = layoutBands[i + 1]!
    if (a.segment.synthetic || b.segment.synthetic) continue
    const yBound = round2(a.y + a.height)
    const left = Math.min(a.leftOuterX, b.leftOuterX)
    const right = Math.max(a.rightOuterX, b.rightOuterX)
    polylines.push({
      id: `segment-boundary-${i}`,
      kind: 'segment_boundary',
      style: 'solid',
      points: [
        { x: left, y: yBound },
        { x: right, y: yBound },
      ],
    })
  }

  // Continuous travel-kerbs at carriageway boundaries. Broken at dual ↔ non-dual
  // so tapers never diagonal-cross the median / opposite-carriageway placeholder.
  {
    const hasFork = (i: number) => layoutBands[i]!.segment.fork != null
    let start = 0
    let runIdx = 0
    while (start < layoutBands.length) {
      let end = start + 1
      while (end < layoutBands.length && hasFork(end) === hasFork(start)) end++
      const slice = layoutBands.slice(start, end)
      emitVerticalPolyline(
        polylines,
        `kerb-left-${runIdx}`,
        'kerb',
        'solid',
        slice.map((b) => ({
          y: b.y,
          height: b.height,
          x: b.leftKerbX,
          width: bandOuterWidth(b),
          synthetic: b.segment.synthetic,
        })),
        'left',
      )
      emitVerticalPolyline(
        polylines,
        `kerb-right-${runIdx}`,
        'kerb',
        'solid',
        slice.map((b) => ({
          y: b.y,
          height: b.height,
          x: b.rightKerbX,
          width: bandOuterWidth(b),
          synthetic: b.segment.synthetic,
        })),
        'right',
      )
      runIdx++
      start = end
    }
  }

  // Placeholder outer face (spreading side) — dual bands only; never merged into a
  // taper that crosses the median from a non-dual neighbour.
  {
    const leftPlaceholderXs = layoutBands.map((b) =>
      b.placeholder && b.segment.fork?.dimmedSide === 'left' ? [b.placeholder.x] : [],
    )
    const rightPlaceholderXs = layoutBands.map((b) =>
      b.placeholder && b.segment.fork?.dimmedSide === 'right'
        ? [round2(b.placeholder.x + b.placeholder.width)]
        : [],
    )
    emitMergedVerticalRuns(
      polylines,
      'kerb-placeholder-left',
      'kerb',
      'solid',
      leftPlaceholderXs,
      layoutBands,
    )
    emitMergedVerticalRuns(
      polylines,
      'kerb-placeholder-right',
      'kerb',
      'solid',
      rightPlaceholderXs,
      layoutBands,
    )
  }

  // Outer edges only where they differ from the travel kerb (sidepath present).
  // Emit like kerbs (continuous X-per-band) so width changes get diagonals — never
  // group by canonical X (that leaves disconnected stubs and 90° gaps).
  {
    const hasDistinctOuter = (b: BandGeometry, side: 'left' | 'right'): boolean => {
      if (side === 'left') {
        if (b.placeholder && b.segment.fork?.dimmedSide === 'left') {
          return differs(b.leftOuterX, b.leftSpreadOuterX) && differs(b.leftOuterX, b.leftKerbX)
        }
        return differs(b.leftOuterX, b.leftKerbX)
      }
      if (b.placeholder && b.segment.fork?.dimmedSide === 'right') {
        return differs(b.rightOuterX, b.rightSpreadOuterX) && differs(b.rightOuterX, b.rightKerbX)
      }
      return differs(b.rightOuterX, b.rightKerbX)
    }

    const emitOuterRuns = (side: 'left' | 'right', idPrefix: string) => {
      const hasFork = (i: number) => layoutBands[i]!.segment.fork != null
      let start = 0
      let runIdx = 0
      while (start < layoutBands.length) {
        let end = start + 1
        while (end < layoutBands.length && hasFork(end) === hasFork(start)) end++
        const slice = layoutBands.slice(start, end)
        let subStart = 0
        while (subStart < slice.length) {
          while (subStart < slice.length && !hasDistinctOuter(slice[subStart]!, side)) {
            subStart++
          }
          if (subStart >= slice.length) break
          let subEnd = subStart + 1
          while (subEnd < slice.length && hasDistinctOuter(slice[subEnd]!, side)) {
            subEnd++
          }
          emitVerticalPolyline(
            polylines,
            `${idPrefix}-${runIdx++}`,
            'outer_edge',
            'solid',
            slice.slice(subStart, subEnd).map((b) => ({
              y: b.y,
              height: b.height,
              x: side === 'left' ? b.leftOuterX : b.rightOuterX,
              width: bandOuterWidth(b),
              synthetic: b.segment.synthetic,
            })),
            side,
          )
          subStart = subEnd
        }
        start = end
      }
    }

    emitOuterRuns('left', 'outer-edge-left')
    emitOuterRuns('right', 'outer-edge-right')
  }

  // Median faces as kerb runs (per dual band, merged when consecutive)
  const medianLeftPerBand = layoutBands.map((b) => (b.medianLeftX != null ? [b.medianLeftX] : []))
  const medianRightPerBand = layoutBands.map((b) =>
    b.medianRightX != null ? [b.medianRightX] : [],
  )
  emitMergedVerticalRuns(
    polylines,
    'kerb-median-left',
    'kerb',
    'solid',
    medianLeftPerBand,
    layoutBands,
  )
  emitMergedVerticalRuns(
    polylines,
    'kerb-median-right',
    'kerb',
    'solid',
    medianRightPerBand,
    layoutBands,
  )

  // Angled kerb where a non-dual turn pocket grows out of the dual travel hinge.
  for (const seam of medianPocketSeams) {
    const { plain, dual, plainIsAbove, pocketLeft, tipX } = seam
    if (plainIsAbove) {
      polylines.push({
        id: `kerb-median-pocket-${seam.seamIndex}`,
        kind: 'kerb',
        style: 'solid',
        points: [
          { x: pocketLeft, y: round2(plain.y) },
          { x: tipX, y: round2(plain.y + plain.height) },
          { x: tipX, y: round2(dual.y + dual.height * TAPER_FRAC) },
        ],
      })
    } else {
      polylines.push({
        id: `kerb-median-pocket-${seam.seamIndex}`,
        kind: 'kerb',
        style: 'solid',
        points: [
          { x: tipX, y: round2(dual.y + dual.height * (1 - TAPER_FRAC)) },
          { x: tipX, y: round2(plain.y) },
          { x: pocketLeft, y: round2(plain.y + plain.height) },
        ],
      })
    }
  }

  // Separators: internal edges within the same zone (not kerb / outer)
  const sepPerBand: number[][] = layoutBands.map((band) => {
    if (band.segment.synthetic) return []
    const xs: number[] = []
    for (let i = 0; i < band.segment.slots.length - 1; i++) {
      const a = band.segment.slots[i]!
      const b = band.segment.slots[i + 1]!
      if (a.zone !== b.zone) continue // kerb lives here
      xs.push(round2(band.slotLeftX[i + 1]!))
    }
    return xs
  })

  // Emit separators grouped by laneMarkings style of the bands they cover
  const solidSep: number[][] = []
  const dashedSep: number[][] = []
  for (let i = 0; i < layoutBands.length; i++) {
    if (layoutBands[i]!.segment.laneMarkings) {
      solidSep.push(sepPerBand[i]!)
      dashedSep.push([])
    } else {
      solidSep.push([])
      dashedSep.push(sepPerBand[i]!)
    }
  }
  emitMergedVerticalRuns(polylines, 'sep-solid', 'separator', 'solid', solidSep, layoutBands)
  emitMergedVerticalRuns(polylines, 'sep-dashed', 'separator', 'dashed', dashedSep, layoutBands)

  // OSM placement centreline guide (lanes align left/right of this axis).
  polylines.push({
    id: 'placement-guide',
    kind: 'placement_guide',
    style: 'solid',
    points: [
      { x: placementGuideX, y: round2(first.y) },
      { x: placementGuideX, y: round2(last.y + last.height) },
    ],
  })

  const separatelyMappedRaw = segments.flatMap((s) => s.separatelyMapped ?? [])
  const separatelyMappedSeen = new Set<string>()
  const separatelyMapped = separatelyMappedRaw.filter((h) => {
    const key = `${h.prefix}:${h.side}`
    if (separatelyMappedSeen.has(key)) return false
    separatelyMappedSeen.add(key)
    return true
  })

  const placementIssues = collectPlacementIssues(segments)

  return {
    widthPx,
    heightPx,
    metersToPx,
    centrelineX: placementGuideX,
    bands: sceneBands,
    ribbons,
    ...(carriagewayPlate ? { carriagewayPlate } : {}),
    slotRects,
    polylines,
    ...(separatelyMapped.length > 0 ? { separatelyMapped } : {}),
    ...(placementIssues.length > 0 ? { placementIssues } : {}),
  }
}
