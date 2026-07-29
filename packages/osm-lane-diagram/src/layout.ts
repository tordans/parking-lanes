import {
  DEFAULT_MEDIAN_GAP_M,
  DEFAULT_METERS_TO_PX,
  SEGMENT_BAND_HEIGHT_PX,
  SEGMENT_GAP_PX,
} from './defaults'
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

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

type BandGeometry = {
  segment: RoadSpaceSegment
  y: number
  height: number
  /** Left edge x of each real slot (same order as segment.slots). */
  slotLeftX: number[]
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
  placeholder?: { x: number; width: number }
}

function placeholderWidthM(fork: NonNullable<RoadSpaceSegment['fork']>): number {
  return fork.placeholderWidthM != null && fork.placeholderWidthM > 0 ? fork.placeholderWidthM : 0
}

function forkGapM(fork: RoadSpaceSegment['fork'] | undefined): number {
  if (!fork) return 0
  return fork.gapM > 0 ? fork.gapM : DEFAULT_MEDIAN_GAP_M
}

function stackWidthM(slots: RoadSpaceSlot[], fork?: RoadSpaceSegment['fork']): number {
  const sum = slots.reduce((s, slot) => s + slot.widthM, 0)
  if (!fork) return sum
  return sum + forkGapM(fork) + placeholderWidthM(fork)
}

/**
 * Metric left edge of each slot within the full LTR stack (placeholder + gap included).
 */
function slotStartsM(segment: RoadSpaceSegment): number[] {
  const { slots, fork } = segment
  const starts: number[] = []
  let x = 0

  if (fork?.dimmedSide === 'left' && placeholderWidthM(fork) > 0) {
    x = placeholderWidthM(fork) + forkGapM(fork)
  }

  const leftSet = new Set(fork?.leftSlotIds ?? [])
  const rightSet = new Set(fork?.rightSlotIds ?? [])
  const gapM = forkGapM(fork)
  let gapInserted = fork?.dimmedSide === 'left' && placeholderWidthM(fork) > 0

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
  let medianLeftX: number | undefined
  let medianRightX: number | undefined

  if (fork && placeholderWidthM(fork) > 0 && fork.dimmedSide === 'left') {
    const pw = placeholderWidthM(fork) * metersToPx
    const gap = forkGapM(fork) * metersToPx
    placeholder = { x: stackLeftX, width: round2(pw) }
    medianLeftX = round2(stackLeftX + pw)
    medianRightX = round2(stackLeftX + pw + gap)
  } else if (fork && placeholderWidthM(fork) > 0 && fork.dimmedSide === 'right') {
    const slotsWidthM = segment.slots.reduce((s, slot) => s + slot.widthM, 0)
    const pw = placeholderWidthM(fork) * metersToPx
    const gap = forkGapM(fork) * metersToPx
    const gapLeft = round2(stackLeftX + slotsWidthM * metersToPx)
    medianLeftX = gapLeft
    medianRightX = round2(gapLeft + gap)
    placeholder = { x: medianRightX, width: round2(pw) }
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
 * Unchanged x → dead-straight (only endpoints). Changing x → diagonal taper in the
 * arriving band's top third (departing band stays straight to the boundary).
 */
function appendContinuousVerticalRun(
  points: Array<{ x: number; y: number }>,
  bandXs: Array<{ y: number; height: number; x: number }>,
): void {
  if (bandXs.length === 0) return

  for (let i = 0; i < bandXs.length; i++) {
    const band = bandXs[i]!
    const topY = round2(band.y)
    const botY = round2(band.y + band.height)
    const x = band.x
    const prev = bandXs[i - 1]
    const next = bandXs[i + 1]

    if (!prev) {
      points.push({ x, y: topY })
    } else if (differs(prev.x, x)) {
      // Taper in this (arriving) band's top third from previous x
      const taperY = round2(band.y + band.height / 3)
      points.push({ x: prev.x, y: topY })
      points.push({ x, y: taperY })
    }

    if (!next) {
      points.push({ x, y: botY })
    } else if (differs(next.x, x)) {
      // Stay at current x through to the boundary; next band owns the diagonal
      points.push({ x, y: botY })
    }
    // else: continuous same-x — no intermediate points
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

/**
 * Fill the triangular notch when adjacent bands have different outer extents:
 * paint the taper region (arriving band's top third) using the wider band's
 * outermost slot kind so the silhouette reads continuous — like a map lane merge.
 */
function appendOuterTaperFills(slotRects: SceneSlotRect[], bands: BandGeometry[]): void {
  for (let i = 0; i < bands.length - 1; i++) {
    const a = bands[i]!
    const b = bands[i + 1]!
    // Never fill across dual ↔ non-dual (would invent a sibling footprint).
    if ((a.segment.fork != null) !== (b.segment.fork != null)) continue

    for (const side of ['left', 'right'] as const) {
      const aOuter = side === 'left' ? a.leftOuterX : a.rightOuterX
      const bOuter = side === 'left' ? b.leftOuterX : b.rightOuterX
      if (!differs(aOuter, bOuter)) continue

      const aWider = side === 'left' ? aOuter < bOuter - EPS : aOuter > bOuter + EPS
      const wider = aWider ? a : b
      const source = outermostSlot(wider, side)
      if (!source) continue

      // Taper lives in the arriving band (b); departing stays straight to the boundary.
      // Diagonal: (aOuter, topY) → (bOuter, taperY). Fill the wedge under the top edge.
      const topY = round2(b.y)
      const taperY = round2(b.y + b.height / 3)
      const points = [
        { x: round2(aOuter), y: topY },
        { x: round2(bOuter), y: topY },
        { x: round2(bOuter), y: taperY },
      ]

      const xs = points.map((p) => p.x)
      const ys = points.map((p) => p.y)
      const left = Math.min(...xs)
      const right = Math.max(...xs)
      const top = Math.min(...ys)
      const bot = Math.max(...ys)

      slotRects.push({
        slotId: `way/${b.segment.wayId}/step-fill/${side}/${i}`,
        wayId: b.segment.wayId,
        role: b.segment.role,
        kind: source.kind,
        zone: source.zone,
        direction: 'none',
        x: round2(left),
        y: round2(top),
        width: round2(right - left),
        height: round2(bot - top),
        widthProvenance: 'inferred',
        label: 'step_fill',
        dimmed: b.segment.role !== 'current' || undefined,
        points,
      })
    }
  }
}

/**
 * When a dual oneway band meets a non-dual neighbour, OSM centrelines diverge
 * (road centre vs carriageway centre). Re-anchor the dual travel stack to the
 * neighbour's continuing kerb so bike/motor lanes line up like a map.
 */
function realignDualBandsToNeighbors(bands: BandGeometry[], metersToPx: number): void {
  for (let i = 0; i < bands.length; i++) {
    const dual = bands[i]!
    const fork = dual.segment.fork
    if (!fork || !dual.placeholder) continue

    const neighbors = [bands[i - 1], bands[i + 1]].filter(
      (b): b is BandGeometry => b != null && b.segment.fork == null,
    )
    if (neighbors.length === 0) continue

    // Prefer the neighbour whose continuing kerb is already closest.
    const neighbor = neighbors.reduce((best, n) => {
      const dualEdge = fork.dimmedSide === 'left' ? dual.rightKerbX : dual.leftKerbX
      const bestEdge = fork.dimmedSide === 'left' ? best.rightKerbX : best.leftKerbX
      const nEdge = fork.dimmedSide === 'left' ? n.rightKerbX : n.leftKerbX
      return Math.abs(nEdge - dualEdge) < Math.abs(bestEdge - dualEdge) ? n : best
    })

    const travelWidth = round2(dual.rightKerbX - dual.leftKerbX)
    if (travelWidth <= EPS) continue

    const gapPx =
      dual.medianLeftX != null && dual.medianRightX != null
        ? round2(dual.medianRightX - dual.medianLeftX)
        : round2(forkGapM(fork) * metersToPx)

    if (fork.dimmedSide === 'left') {
      const targetRight = neighbor.rightKerbX
      const targetLeftBound = neighbor.leftKerbX
      const newTravelRight = targetRight
      const newTravelLeft = round2(newTravelRight - travelWidth)
      if (newTravelLeft < targetLeftBound - EPS) continue

      const newMedianRight = newTravelLeft
      const newMedianLeft = round2(newMedianRight - gapPx)
      const newPlaceholderX = targetLeftBound
      const newPlaceholderWidth = round2(newMedianLeft - newPlaceholderX)
      if (newPlaceholderWidth < EPS) continue

      const delta = round2(newTravelLeft - dual.leftKerbX)
      dual.slotLeftX = dual.slotLeftX.map((x) => round2(x + delta))
      dual.leftKerbX = newTravelLeft
      dual.rightKerbX = newTravelRight
      dual.placeholder = { x: newPlaceholderX, width: newPlaceholderWidth }
      dual.medianLeftX = newMedianLeft
      dual.medianRightX = newMedianRight
      dual.leftOuterX = newPlaceholderX
      dual.leftSpreadOuterX = newPlaceholderX
      dual.rightOuterX = round2(
        Math.max(
          newTravelRight,
          ...dual.segment.slots.map((s, idx) => dual.slotLeftX[idx]! + s.widthM * metersToPx),
        ),
      )
      dual.rightSpreadOuterX = dual.rightOuterX
      dual.centrelineX = round2((newTravelLeft + newTravelRight) / 2)
    } else if (fork.dimmedSide === 'right') {
      const targetLeft = neighbor.leftKerbX
      const targetRightBound = neighbor.rightKerbX
      const newTravelLeft = targetLeft
      const newTravelRight = round2(newTravelLeft + travelWidth)
      if (newTravelRight > targetRightBound + EPS) continue

      const newMedianLeft = newTravelRight
      const newMedianRight = round2(newMedianLeft + gapPx)
      const newPlaceholderRight = targetRightBound
      const newPlaceholderX = newMedianRight
      const newPlaceholderWidth = round2(newPlaceholderRight - newPlaceholderX)
      if (newPlaceholderWidth < EPS) continue

      const delta = round2(newTravelLeft - dual.leftKerbX)
      dual.slotLeftX = dual.slotLeftX.map((x) => round2(x + delta))
      dual.leftKerbX = newTravelLeft
      dual.rightKerbX = newTravelRight
      dual.placeholder = { x: newPlaceholderX, width: newPlaceholderWidth }
      dual.medianLeftX = newMedianLeft
      dual.medianRightX = newMedianRight
      dual.rightOuterX = newPlaceholderRight
      dual.rightSpreadOuterX = newPlaceholderRight
      dual.leftOuterX = round2(Math.min(newTravelLeft, ...dual.slotLeftX))
      dual.leftSpreadOuterX = dual.leftOuterX
      dual.centrelineX = round2((newTravelLeft + newTravelRight) / 2)
    }
  }
}

function emitVerticalPolyline(
  polylines: ScenePolyline[],
  id: string,
  kind: ScenePolyline['kind'],
  style: ScenePolyline['style'],
  bandXs: Array<{ y: number; height: number; x: number }>,
): void {
  if (bandXs.length === 0) return
  const points: Array<{ x: number; y: number }> = []
  appendContinuousVerticalRun(points, bandXs)
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
  const allX = new Set<number>()
  for (const xs of rounded) for (const x of xs) allX.add(x)

  const hasFork = (i: number) => bands[i]!.segment.fork != null

  let runIdx = 0
  for (const x of [...allX].sort((a, b) => a - b)) {
    let i = 0
    while (i < bands.length) {
      if (!rounded[i]!.some((v) => Math.abs(v - x) < EPS)) {
        i++
        continue
      }
      const start = i
      i++
      while (i < bands.length && rounded[i]!.some((v) => Math.abs(v - x) < EPS)) {
        if (options?.breakOnForkChange && hasFork(i) !== hasFork(i - 1)) break
        i++
      }
      const slice = bands.slice(start, i).map((b) => ({
        y: b.y,
        height: b.height,
        x,
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
      slotRects: [],
      polylines: [],
    }
  }

  const maxLeftOverhang = Math.max(...segments.map((s) => s.centrelineOffsetM * metersToPx))
  const maxRightOverhang = Math.max(
    ...segments.map((s) => (stackWidthM(s.slots, s.fork) - s.centrelineOffsetM) * metersToPx),
  )
  const centrelineX = round2(PADDING_PX + maxLeftOverhang)

  const bands: BandGeometry[] = []
  let y = PADDING_PX
  for (const segment of segments) {
    bands.push(buildBandGeometry(segment, y, bandHeight, centrelineX, metersToPx))
    y += bandHeight + gap
  }
  realignDualBandsToNeighbors(bands, metersToPx)

  const heightPx = round2(y - (bands.length > 0 ? gap : 0) + PADDING_PX)
  // After dual realignment, outer extents may exceed the initial centreline overhang estimate.
  const maxRightX = Math.max(...bands.map((b) => b.rightOuterX), centrelineX)
  const minLeftX = Math.min(...bands.map((b) => b.leftOuterX), PADDING_PX)
  const widthPx = round2(
    Math.max(
      centrelineX + maxRightOverhang + PADDING_PX,
      maxRightX + PADDING_PX,
      maxRightX - minLeftX + PADDING_PX * 2,
    ),
  )

  const sceneBands: SceneSegmentBand[] = bands.map((b) => ({
    wayId: b.segment.wayId,
    role: b.segment.role,
    y: round2(b.y),
    height: round2(b.height),
    dimmed: b.segment.role !== 'current',
  }))

  const slotRects: SceneSlotRect[] = []
  for (let bandIndex = 0; bandIndex < bands.length; bandIndex++) {
    const band = bands[bandIndex]!
    const extent = rectVerticalExtent(bandIndex, bands.length, band.y, band.height)
    const dimmedBand = band.segment.role !== 'current'
    const fork = band.segment.fork
    const leftSet = new Set(fork?.leftSlotIds ?? [])
    const rightSet = new Set(fork?.rightSlotIds ?? [])

    // Sibling carriageway placeholder — only when this band's own tags forked.
    if (band.placeholder) {
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
        dimmed: dimmedBand || undefined,
      })
    }

    for (let i = 0; i < band.segment.slots.length; i++) {
      const slot = band.segment.slots[i]!
      let dimmed = dimmedBand
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

  appendOuterTaperFills(slotRects, bands)

  const polylines: ScenePolyline[] = []

  // Butt-end caps at the two ends of the whole chain (outer edges)
  const first = bands[0]!
  const last = bands[bands.length - 1]!
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

  // Segment-boundary hairlines at interior boundaries
  for (let i = 0; i < bands.length - 1; i++) {
    const a = bands[i]!
    const b = bands[i + 1]!
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
    const hasFork = (i: number) => bands[i]!.segment.fork != null
    let start = 0
    let runIdx = 0
    while (start < bands.length) {
      let end = start + 1
      while (end < bands.length && hasFork(end) === hasFork(start)) end++
      const slice = bands.slice(start, end)
      emitVerticalPolyline(
        polylines,
        `kerb-left-${runIdx}`,
        'kerb',
        'solid',
        slice.map((b) => ({ y: b.y, height: b.height, x: b.leftKerbX })),
      )
      emitVerticalPolyline(
        polylines,
        `kerb-right-${runIdx}`,
        'kerb',
        'solid',
        slice.map((b) => ({ y: b.y, height: b.height, x: b.rightKerbX })),
      )
      runIdx++
      start = end
    }
  }

  // Placeholder outer face (spreading side) — dual bands only; never merged into a
  // taper that crosses the median from a non-dual neighbour.
  {
    const leftPlaceholderXs = bands.map((b) =>
      b.placeholder && b.segment.fork?.dimmedSide === 'left' ? [b.placeholder.x] : [],
    )
    const rightPlaceholderXs = bands.map((b) =>
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
      bands,
    )
    emitMergedVerticalRuns(
      polylines,
      'kerb-placeholder-right',
      'kerb',
      'solid',
      rightPlaceholderXs,
      bands,
    )
  }

  // Outer edges only where they differ from the travel kerb (sidepath present),
  // broken at dual ↔ non-dual so the spreading envelope does not step-cross
  // the placeholder / median.
  {
    const leftOuterPerBand = bands.map((b) => {
      // Prefer sidepath outer; on left-spreading duals the spread envelope is the
      // placeholder face (already emitted as kerb-placeholder-left).
      if (b.placeholder && b.segment.fork?.dimmedSide === 'left') {
        return differs(b.leftOuterX, b.leftSpreadOuterX) && differs(b.leftOuterX, b.leftKerbX)
          ? [b.leftOuterX]
          : []
      }
      return differs(b.leftOuterX, b.leftKerbX) ? [b.leftOuterX] : []
    })
    const rightOuterPerBand = bands.map((b) => {
      if (b.placeholder && b.segment.fork?.dimmedSide === 'right') {
        return differs(b.rightOuterX, b.rightSpreadOuterX) && differs(b.rightOuterX, b.rightKerbX)
          ? [b.rightOuterX]
          : []
      }
      return differs(b.rightOuterX, b.rightKerbX) ? [b.rightOuterX] : []
    })
    emitMergedVerticalRuns(
      polylines,
      'outer-edge-left',
      'outer_edge',
      'solid',
      leftOuterPerBand,
      bands,
      { breakOnForkChange: true },
    )
    emitMergedVerticalRuns(
      polylines,
      'outer-edge-right',
      'outer_edge',
      'solid',
      rightOuterPerBand,
      bands,
      { breakOnForkChange: true },
    )
  }

  // Median faces as kerb runs (per dual band, merged when consecutive)
  const medianLeftPerBand = bands.map((b) => (b.medianLeftX != null ? [b.medianLeftX] : []))
  const medianRightPerBand = bands.map((b) => (b.medianRightX != null ? [b.medianRightX] : []))
  emitMergedVerticalRuns(polylines, 'kerb-median-left', 'kerb', 'solid', medianLeftPerBand, bands)
  emitMergedVerticalRuns(polylines, 'kerb-median-right', 'kerb', 'solid', medianRightPerBand, bands)

  // Separators: internal edges within the same zone (not kerb / outer)
  const sepPerBand: number[][] = bands.map((band) => {
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
  for (let i = 0; i < bands.length; i++) {
    if (bands[i]!.segment.laneMarkings) {
      solidSep.push(sepPerBand[i]!)
      dashedSep.push([])
    } else {
      solidSep.push([])
      dashedSep.push(sepPerBand[i]!)
    }
  }
  emitMergedVerticalRuns(polylines, 'sep-solid', 'separator', 'solid', solidSep, bands)
  emitMergedVerticalRuns(polylines, 'sep-dashed', 'separator', 'dashed', dashedSep, bands)

  // Centreline: continuous within fork-homogeneous runs (never diagonal through median).
  {
    const hasFork = (i: number) => bands[i]!.segment.fork != null
    let start = 0
    let runIdx = 0
    while (start < bands.length) {
      let end = start + 1
      while (end < bands.length && hasFork(end) === hasFork(start)) end++
      const slice = bands.slice(start, end)
      emitVerticalPolyline(
        polylines,
        runIdx === 0 ? 'centreline' : `centreline-${runIdx}`,
        'centreline',
        'dashed',
        slice.map((b) => ({ y: b.y, height: b.height, x: b.centrelineX })),
      )
      runIdx++
      start = end
    }
  }

  const separatelyMappedRaw = segments.flatMap((s) => s.separatelyMapped ?? [])
  const separatelyMappedSeen = new Set<string>()
  const separatelyMapped = separatelyMappedRaw.filter((h) => {
    const key = `${h.prefix}:${h.side}`
    if (separatelyMappedSeen.has(key)) return false
    separatelyMappedSeen.add(key)
    return true
  })

  return {
    widthPx,
    heightPx,
    metersToPx,
    bands: sceneBands,
    slotRects,
    polylines,
    ...(separatelyMapped.length > 0 ? { separatelyMapped } : {}),
  }
}
