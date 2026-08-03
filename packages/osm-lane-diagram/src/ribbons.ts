import { slicesCorrespond, turnSignature, type StackCorrespondence } from './correspondence'

export { turnSignature } from './correspondence'
import { TAPER_FRAC } from './defaults'
import type {
  RoadSpaceSegment,
  RoadSpaceSlot,
  SceneRibbon,
  SceneRibbonBandSlice,
  SceneSlotRectKind,
} from './types'

const EPS = 0.01

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

function differs(a: number, b: number): boolean {
  return Math.abs(a - b) > EPS
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

type BandGeometry = {
  segment: RoadSpaceSegment
  y: number
  height: number
  slotLeftX: number[]
  siblingSlotLeftX?: number[]
  centrelineX?: number
  leftKerbX: number
  rightKerbX: number
  leftOuterX: number
  rightOuterX: number
  placeholder?: { x: number; width: number }
}

type SlotSlice = {
  bandIndex: number
  slotIndex: number
  /** Upper-segment index for glue-band slices (correspondence indexA). */
  corrIndexA?: number
  corrBranchA?: 'travel' | 'sibling'
  slot: RoadSpaceSlot
  wayId: number
  leftX: number
  rightX: number
  centerX: number
  y: number
  height: number
  dimmed: boolean
  isSibling: boolean
  isPlaceholder: boolean
  turnKey: string
}

function ordinalInTurnGroup(slots: RoadSpaceSlot[], index: number): number {
  const slot = slots[index]
  if (!slot) return 0
  const key = turnSignature(slot)
  let ord = 0
  for (let i = 0; i < index; i++) {
    const s = slots[i]!
    if (
      s.zone === slot.zone &&
      s.kind === slot.kind &&
      s.direction === slot.direction &&
      turnSignature(s) === key
    ) {
      ord++
    }
  }
  return ord
}

/**
 * Dim only the opposite dual-carriageway branch (and callers that force sibling/
 * placeholder slices). Do **not** dim primary travel lanes just because they sit on
 * a prev/next band — otherwise disappearing pockets / extra lanes wash out to
 * sidewalk-looking gray while through ribbons that chain into `current` stay dark.
 */
function isSlotDimmed(band: BandGeometry, slot: RoadSpaceSlot, _bandDimmed: boolean): boolean {
  const fork = band.segment.fork
  if (!fork) return false
  const leftSet = new Set(fork.leftSlotIds ?? [])
  const rightSet = new Set(fork.rightSlotIds ?? [])
  if (fork.dimmedSide === 'left' && leftSet.has(slot.id)) return true
  if (fork.dimmedSide === 'right' && rightSet.has(slot.id)) return true
  return false
}

function isOutermostSlice(
  slice: SlotSlice,
  band: BandGeometry,
  bands: BandGeometry[],
  side: 'left' | 'right',
): boolean {
  const slots = slotsForOrdinal(slice, band, bands)
  if (slots.length === 0) return true
  const idx = slice.slotIndex
  // Geometric outer of this zone (not “first motor” / “first cycle”) — otherwise interior
  // kinds falsely taper to the kerb and smear across dual medians.
  if (side === 'left') {
    return slots.slice(0, idx).every((s) => s.zone !== slice.slot.zone)
  }
  return slots.slice(idx + 1).every((s) => s.zone !== slice.slot.zone)
}

/** Travel-face kerb; for dual bands this is only the selected branch, not the full road. */
function bandTravelKerbX(band: BandGeometry, side: 'left' | 'right'): number | undefined {
  return side === 'left' ? band.leftKerbX : band.rightKerbX
}

/** Full corridor outer (includes opposite dual branch when present). */
function bandRoadOuterX(band: BandGeometry, side: 'left' | 'right'): number {
  if (side === 'left') return band.leftOuterX ?? band.leftKerbX
  return band.rightOuterX ?? band.rightKerbX
}

function isDualPlainSeam(a: BandGeometry, b: BandGeometry): boolean {
  return hasFork(a) !== hasFork(b)
}

function sliceGeometry(
  band: BandGeometry,
  index: number,
  isSibling: boolean,
  metersToPx: number,
): { slot: RoadSpaceSlot; leftX: number; rightX: number; wayId: number } | null {
  if (isSibling) {
    const slot = band.segment.fork?.siblingSlots?.[index]
    const leftX = band.siblingSlotLeftX?.[index]
    if (!slot || leftX == null) return null
    const rightX = round2(leftX + slot.widthM * metersToPx)
    return { slot, leftX, rightX, wayId: band.segment.fork?.siblingWayId ?? band.segment.wayId }
  }
  const slot = band.segment.slots[index]
  const leftX = band.slotLeftX[index]
  if (!slot || leftX == null) return null
  const rightX = round2(leftX + slot.widthM * metersToPx)
  return { slot, leftX, rightX, wayId: band.segment.wayId }
}

function collectBandSlices(
  bands: BandGeometry[],
  metersToPx: number,
  extentForBand: (i: number) => { y: number; height: number },
  corrBetweenBands: StackCorrespondence[],
): SlotSlice[] {
  const slices: SlotSlice[] = []

  for (let bi = 0; bi < bands.length; bi++) {
    const band = bands[bi]!
    const extent = extentForBand(bi)
    const bandDimmed = band.segment.role !== 'current'
    const fork = band.segment.fork

    for (let si = 0; si < band.segment.slots.length; si++) {
      const slot = band.segment.slots[si]!
      const leftX = band.slotLeftX[si]!
      const rightX = round2(leftX + slot.widthM * metersToPx)
      slices.push({
        bandIndex: bi,
        slotIndex: si,
        slot,
        wayId: band.segment.wayId,
        leftX,
        rightX,
        centerX: round2((leftX + rightX) / 2),
        y: extent.y,
        height: extent.height,
        dimmed: isSlotDimmed(band, slot, bandDimmed),
        isSibling: false,
        isPlaceholder: false,
        turnKey: turnSignature(slot),
      })
    }

    if (fork?.siblingSlots && band.siblingSlotLeftX) {
      for (let si = 0; si < fork.siblingSlots.length; si++) {
        const slot = fork.siblingSlots[si]!
        const leftX = band.siblingSlotLeftX[si]!
        const rightX = round2(leftX + slot.widthM * metersToPx)
        slices.push({
          bandIndex: bi,
          slotIndex: si,
          slot,
          wayId: fork.siblingWayId ?? band.segment.wayId,
          leftX,
          rightX,
          centerX: round2((leftX + rightX) / 2),
          y: extent.y,
          height: extent.height,
          dimmed: true,
          isSibling: true,
          isPlaceholder: false,
          turnKey: turnSignature(slot),
        })
      }
    }
  }

  for (let bi = 0; bi < bands.length; bi++) {
    const band = bands[bi]!
    if (!band.segment.synthetic) continue
    const corr = corrBetweenBands[bi - 1] ?? { pairs: [], unmatchedA: [], unmatchedB: [] }
    slices.push(...collectSyntheticSlices(bands, bi, metersToPx, extentForBand, corr))
  }

  return slices
}

function collectSyntheticSlices(
  bands: BandGeometry[],
  bi: number,
  metersToPx: number,
  extentForBand: (i: number) => { y: number; height: number },
  corr: StackCorrespondence,
): SlotSlice[] {
  const above = bands[bi - 1]
  const below = bands[bi + 1]
  if (!above || !below || above.segment.synthetic || below.segment.synthetic) return []

  const extent = extentForBand(bi)
  const out: SlotSlice[] = []
  const matchedBelow = new Set<string>()

  for (const pair of corr.pairs) {
    const branchA = pair.branchA ?? 'travel'
    const branchB = pair.branchB ?? 'travel'
    const isSiblingA = branchA === 'sibling'
    const isSiblingB = branchB === 'sibling'
    const aboveGeom = sliceGeometry(above, pair.indexA, isSiblingA, metersToPx)
    const belowGeom = sliceGeometry(below, pair.indexB, isSiblingB, metersToPx)
    if (!aboveGeom || !belowGeom) continue
    matchedBelow.add(`${branchB}:${pair.indexB}`)
    const leftX = round2((aboveGeom.leftX + belowGeom.leftX) / 2)
    const rightX = round2((aboveGeom.rightX + belowGeom.rightX) / 2)
    out.push({
      bandIndex: bi,
      slotIndex: pair.indexB,
      corrIndexA: pair.indexA,
      corrBranchA: branchA,
      slot: belowGeom.slot,
      wayId: belowGeom.wayId,
      leftX,
      rightX,
      centerX: round2((leftX + rightX) / 2),
      y: extent.y,
      height: extent.height,
      dimmed: true,
      isSibling: isSiblingB,
      isPlaceholder: false,
      turnKey: turnSignature(belowGeom.slot),
    })
  }

  const cwIdxs = below.segment.slots
    .map((s, i) => (s.zone === 'carriageway' ? i : -1))
    .filter((i) => i >= 0)

  for (const u of corr.unmatchedB) {
    const branch = u.branch ?? 'travel'
    const key = `${branch}:${u.index}`
    if (matchedBelow.has(key)) continue
    const belowGeom = sliceGeometry(below, u.index, branch === 'sibling', metersToPx)
    if (!belowGeom || belowGeom.slot.zone !== 'carriageway') continue
    const isRight = !u.branch && u.index === cwIdxs[cwIdxs.length - 1]
    const isLeft = !u.branch && u.index === cwIdxs[0]
    if (isRight && belowGeom.rightX > above.rightKerbX + EPS) {
      const hinge = above.rightKerbX
      out.push({
        bandIndex: bi,
        slotIndex: u.index,
        slot: belowGeom.slot,
        wayId: belowGeom.wayId,
        leftX: hinge,
        rightX: hinge,
        centerX: hinge,
        y: extent.y,
        height: extent.height,
        dimmed: true,
        isSibling: branch === 'sibling',
        isPlaceholder: false,
        turnKey: turnSignature(belowGeom.slot),
      })
    } else if (isLeft && belowGeom.leftX < above.leftKerbX - EPS) {
      const hinge = above.leftKerbX
      out.push({
        bandIndex: bi,
        slotIndex: u.index,
        slot: belowGeom.slot,
        wayId: belowGeom.wayId,
        leftX: hinge,
        rightX: hinge,
        centerX: hinge,
        y: extent.y,
        height: extent.height,
        dimmed: true,
        isSibling: branch === 'sibling',
        isPlaceholder: false,
        turnKey: turnSignature(belowGeom.slot),
      })
    }
  }

  const aboveCwIdxs = above.segment.slots
    .map((s, i) => (s.zone === 'carriageway' ? i : -1))
    .filter((i) => i >= 0)
  const matchedAbove = new Set(corr.pairs.map((p) => `${p.branchA ?? 'travel'}:${p.indexA}`))

  for (const u of corr.unmatchedA) {
    const branch = u.branch ?? 'travel'
    const key = `${branch}:${u.index}`
    if (matchedAbove.has(key)) continue
    const aboveGeom = sliceGeometry(above, u.index, branch === 'sibling', metersToPx)
    if (!aboveGeom || aboveGeom.slot.zone !== 'carriageway') continue
    const isRight = !u.branch && u.index === aboveCwIdxs[aboveCwIdxs.length - 1]
    const isLeft = !u.branch && u.index === aboveCwIdxs[0]
    if (isRight && aboveGeom.rightX > below.rightKerbX + EPS) {
      const hinge = below.rightKerbX
      out.push({
        bandIndex: bi,
        slotIndex: u.index,
        slot: aboveGeom.slot,
        wayId: aboveGeom.wayId,
        leftX: hinge,
        rightX: hinge,
        centerX: hinge,
        y: extent.y,
        height: extent.height,
        dimmed: true,
        isSibling: branch === 'sibling',
        isPlaceholder: false,
        turnKey: turnSignature(aboveGeom.slot),
      })
    } else if (isLeft && aboveGeom.leftX < below.leftKerbX - EPS) {
      const hinge = below.leftKerbX
      out.push({
        bandIndex: bi,
        slotIndex: u.index,
        slot: aboveGeom.slot,
        wayId: aboveGeom.wayId,
        leftX: hinge,
        rightX: hinge,
        centerX: hinge,
        y: extent.y,
        height: extent.height,
        dimmed: true,
        isSibling: branch === 'sibling',
        isPlaceholder: false,
        turnKey: turnSignature(aboveGeom.slot),
      })
    }
  }

  return out
}

function hasFork(band: BandGeometry): boolean {
  return band.segment.fork != null
}

function slotsForOrdinal(
  slice: SlotSlice,
  band: BandGeometry,
  bands: BandGeometry[],
): RoadSpaceSlot[] {
  if (slice.isSibling) return band.segment.fork?.siblingSlots ?? []
  if (band.segment.synthetic) {
    const above = bands[slice.bandIndex - 1]
    if (
      above &&
      !above.segment.synthetic &&
      above.segment.slots.some((s) => s.id === slice.slot.id)
    ) {
      return above.segment.slots
    }
    const below = bands[slice.bandIndex + 1]
    if (
      below &&
      !below.segment.synthetic &&
      below.segment.slots.some((s) => s.id === slice.slot.id)
    ) {
      return below.segment.slots
    }
    if (below && !below.segment.synthetic) return below.segment.slots
    if (above && !above.segment.synthetic) return above.segment.slots
    return []
  }
  return band.segment.slots
}

function chainScore(tail: SlotSlice, candidate: SlotSlice, bands: BandGeometry[]): number {
  const dx = Math.abs(candidate.centerX - tail.centerX)
  const tailSlots = slotsForOrdinal(tail, bands[tail.bandIndex]!, bands)
  const candSlots = slotsForOrdinal(candidate, bands[candidate.bandIndex]!, bands)
  const ordDelta = Math.abs(
    ordinalInTurnGroup(tailSlots, tail.slotIndex) -
      ordinalInTurnGroup(candSlots, candidate.slotIndex),
  )
  return dx + ordDelta * 8
}

function pickBestCandidate(
  tail: SlotSlice,
  candidates: SlotSlice[],
  bands: BandGeometry[],
): SlotSlice | undefined {
  if (candidates.length === 0) return undefined
  return candidates.reduce((best, c) =>
    chainScore(tail, c, bands) < chainScore(tail, best, bands) ? c : best,
  )
}

function canChain(
  a: SlotSlice,
  b: SlotSlice,
  bands: BandGeometry[],
  corrBetweenBands: StackCorrespondence[],
): boolean {
  if (Math.abs(a.bandIndex - b.bandIndex) !== 1) return false
  if (a.isSibling !== b.isSibling) return false
  if (a.isPlaceholder !== b.isPlaceholder) return false
  if (a.isPlaceholder && b.isPlaceholder) return true

  const pairIdx = Math.min(a.bandIndex, b.bandIndex)
  const corr = corrBetweenBands[pairIdx]
  if (!corr) return false

  const upper = a.bandIndex < b.bandIndex ? a : b
  const lower = a.bandIndex < b.bandIndex ? b : a
  const upperBand = bands[upper.bandIndex]!
  const lowerBand = bands[lower.bandIndex]!

  let indexA: number
  let indexB: number
  let branchA = upper.isSibling ? 'sibling' : 'travel'
  let branchB = lower.isSibling ? 'sibling' : 'travel'

  if (upperBand.segment.synthetic && !lowerBand.segment.synthetic) {
    indexA = upper.corrIndexA ?? upper.slotIndex
    indexB = lower.slotIndex
    branchA = upper.corrBranchA ?? (upper.isSibling ? 'sibling' : 'travel')
    branchB = lower.isSibling ? 'sibling' : 'travel'
  } else if (!upperBand.segment.synthetic && lowerBand.segment.synthetic) {
    indexA = upper.slotIndex
    indexB = lower.slotIndex
    branchA = upper.isSibling ? 'sibling' : 'travel'
    branchB = lower.isSibling ? 'sibling' : 'travel'
  } else if (!upperBand.segment.synthetic && !lowerBand.segment.synthetic) {
    indexA = upper.slotIndex
    indexB = lower.slotIndex
  } else {
    return false
  }

  return slicesCorrespond(corr, indexA, branchA === 'sibling', indexB, branchB === 'sibling')
}

type Chain = SlotSlice[]

function buildChains(
  slices: SlotSlice[],
  bands: BandGeometry[],
  corrBetweenBands: StackCorrespondence[],
): Chain[] {
  const byBand: SlotSlice[][] = bands.map(() => [])
  for (const s of slices) byBand[s.bandIndex]!.push(s)

  const chains: Chain[] = []
  const used = new Set<SlotSlice>()

  const pickBest = (tail: SlotSlice, candidates: SlotSlice[]): SlotSlice | undefined =>
    pickBestCandidate(tail, candidates, bands)

  for (const start of byBand[0] ?? []) {
    const chain: Chain = [start]
    used.add(start)
    let tail = start
    for (let bi = 1; bi < bands.length; bi++) {
      const candidates = byBand[bi]!.filter(
        (c) => !used.has(c) && canChain(tail, c, bands, corrBetweenBands),
      )
      const next = pickBest(tail, candidates)
      if (!next) break
      chain.push(next)
      used.add(next)
      tail = next
    }
    chains.push(chain)
  }

  for (let bi = 1; bi < bands.length; bi++) {
    for (const s of byBand[bi]!) {
      if (used.has(s)) continue
      const chain: Chain = [s]
      used.add(s)
      let head = s
      for (let bj = bi - 1; bj >= 0; bj--) {
        const candidates = byBand[bj]!.filter(
          (c) => !used.has(c) && canChain(c, head, bands, corrBetweenBands),
        )
        const prev = pickBest(head, candidates)
        if (!prev) break
        chain.unshift(prev)
        used.add(prev)
        head = prev
      }
      let tail = s
      for (let bj = bi + 1; bj < bands.length; bj++) {
        const candidates = byBand[bj]!.filter(
          (c) => !used.has(c) && canChain(tail, c, bands, corrBetweenBands),
        )
        const next = pickBest(tail, candidates)
        if (!next) break
        chain.push(next)
        used.add(next)
        tail = next
      }
      chains.push(chain)
    }
  }

  return chains
}

function appendRibbonEdge(
  points: Array<{ x: number; y: number }>,
  bandEdges: Array<{
    y: number
    height: number
    x: number
    width: number
    synthetic?: boolean
  }>,
  edge: 'left' | 'right',
  options?: { morphShift?: boolean; outwardSide?: 'left' | 'right' },
): void {
  if (bandEdges.length === 0) return
  // outwardSide: which way “wider road” grows (matches kerb/outer stroke semantics).
  // For a right sidewalk, both polygon edges follow the right kerb/outer → outwardSide=right.
  const outward = options?.outwardSide ?? edge
  const isWider = (a: number, b: number) => (outward === 'right' ? a > b + EPS : a < b - EPS)
  const morphShift = options?.morphShift ?? false
  const edgeX = (band: { x: number; width: number }) =>
    edge === 'left' ? band.x : round2(band.x + band.width)

  for (let i = 0; i < bandEdges.length; i++) {
    const band = bandEdges[i]!
    const topY = round2(band.y)
    const botY = round2(band.y + band.height)
    const x = edgeX(band)
    const prev = bandEdges[i - 1]
    const next = bandEdges[i + 1]

    if (band.synthetic) {
      const prevX = prev ? edgeX(prev) : x
      const nextX = next ? edgeX(next) : x
      const topX = prev && !prev.synthetic ? prevX : x
      const botX = next && !next.synthetic ? nextX : x
      if (!prev) points.push({ x: topX, y: topY })
      else if (!prev.synthetic) points.push({ x: prevX, y: topY })
      points.push({ x: botX, y: botY })
      continue
    }

    if (!prev) {
      points.push({ x, y: topY })
    } else if (prev.synthetic) {
      points.push({ x, y: topY })
    } else {
      const prevX = edgeX(prev)
      if (differs(prevX, x)) {
        const treatAsWidthChange = morphShift || differs(prev.width, band.width)
        if (!treatAsWidthChange) {
          points.push({ x: prevX, y: topY })
          points.push({ x, y: topY })
        } else if (isWider(x, prevX)) {
          const taperY = round2(band.y + band.height * TAPER_FRAC)
          points.push({ x: prevX, y: topY })
          points.push({ x, y: taperY })
        } else {
          points.push({ x, y: topY })
        }
      }
    }

    if (!next) {
      points.push({ x, y: botY })
    } else if (next.synthetic) {
      points.push({ x, y: botY })
    } else {
      const nextX = edgeX(next)
      if (differs(nextX, x)) {
        const treatAsWidthChange = morphShift || differs(band.width, next.width)
        if (!treatAsWidthChange) {
          points.push({ x, y: botY })
        } else if (isWider(x, nextX)) {
          const taperY = round2(band.y + band.height * (1 - TAPER_FRAC))
          points.push({ x, y: taperY })
          points.push({ x: nextX, y: botY })
        } else {
          points.push({ x, y: botY })
        }
      }
    }
  }
}

function ribbonPolygon(chain: Chain, bands: BandGeometry[]): Array<{ x: number; y: number }> {
  const head = chain[0]!
  const headBand = bands[head.bandIndex]!
  // Sidepaths translate with kerb/outer — morph both edges as a parallelogram using the
  // road-side outward semantics so diagonals land on the same band as kerb/outer strokes.
  const morphBoth = head.slot.zone === 'sidepath'
  const outwardSide: 'left' | 'right' =
    head.centerX <= (headBand.centrelineX ?? head.centerX) ? 'left' : 'right'

  const edges = chain.map((s) => {
    const band = bands[s.bandIndex]!
    return {
      // Use band geometry (not overlapped slot extents) so ribbon diagonals meet kerb/outer strokes.
      y: band.y,
      height: band.height,
      x: s.leftX,
      width: round2(s.rightX - s.leftX),
      synthetic: band.segment.synthetic,
    }
  })
  const left: Array<{ x: number; y: number }> = []
  const right: Array<{ x: number; y: number }> = []
  appendRibbonEdge(left, edges, 'left', {
    morphShift: morphBoth,
    outwardSide: morphBoth ? outwardSide : 'left',
  })
  appendRibbonEdge(right, edges, 'right', {
    morphShift: morphBoth,
    outwardSide: morphBoth ? outwardSide : 'right',
  })
  right.reverse()
  return dedupePoints([...left, ...right])
}

function chainToRibbon(chain: Chain, bands: BandGeometry[]): SceneRibbon | null {
  if (chain.length === 0) return null
  const head = chain[0]!
  const points = ribbonPolygon(chain, bands)
  if (points.length < 3) return null

  const bandSlices: SceneRibbonBandSlice[] = chain.map((s) => ({
    bandIndex: s.bandIndex,
    wayId: s.wayId,
    role: bands[s.bandIndex]!.segment.role,
    slotId: s.slot.id,
    y: s.y,
    height: s.height,
  }))

  const currentSlice = chain.find(
    (s) => bands[s.bandIndex]!.segment.role === 'current' && !bands[s.bandIndex]!.segment.synthetic,
  )
  const realSlice = chain.find((s) => !bands[s.bandIndex]!.segment.synthetic)
  const glyphSlice = currentSlice ?? realSlice ?? chain[Math.floor(chain.length / 2)]!

  const ord = head.isPlaceholder
    ? 0
    : ordinalInTurnGroup(
        head.isSibling
          ? (bands[head.bandIndex]!.segment.fork?.siblingSlots ?? [])
          : bands[head.bandIndex]!.segment.slots,
        head.slotIndex,
      )

  return {
    id: `ribbon/${head.isSibling ? 'sibling/' : ''}${head.slot.zone}/${head.slot.kind}/${head.slot.direction}/${head.turnKey}/${ord}/${head.slot.id}`,
    slotId: head.slot.id,
    kind: head.slot.kind as SceneSlotRectKind,
    zone: head.slot.zone,
    direction: head.slot.direction,
    widthProvenance: head.slot.widthProvenance,
    label: head.isPlaceholder ? 'sibling' : head.slot.label,
    turn: glyphSlice.slot.turn,
    dimmed: chain.every((s) => s.dimmed) || undefined,
    points,
    bandSlices,
    glyphCx: glyphSlice.centerX,
    glyphCy: round2(glyphSlice.y + glyphSlice.height / 2),
    glyphBandRole: bands[glyphSlice.bandIndex]!.segment.role,
  }
}

function findCorrespondingInBand(
  slice: SlotSlice,
  bandIndex: number,
  allSlices: SlotSlice[],
  bands: BandGeometry[],
  corrBetweenBands: StackCorrespondence[],
): SlotSlice | undefined {
  const candidates = allSlices.filter(
    (s) =>
      s.bandIndex === bandIndex &&
      s.isSibling === slice.isSibling &&
      s.isPlaceholder === slice.isPlaceholder &&
      canChain(slice, s, bands, corrBetweenBands),
  )
  return pickBestCandidate(slice, candidates, bands)
}

/** Kerb-aware tapers at band seams for appearing / disappearing / widening lanes. */
export function enrichRibbonTapers(
  ribbons: SceneRibbon[],
  bands: BandGeometry[],
  _metersToPx: number,
  allSlices: SlotSlice[],
  corrBetweenBands: StackCorrespondence[],
): void {
  for (const ribbon of ribbons) {
    if (ribbon.bandSlices.length === 0) continue

    const chain: SlotSlice[] = ribbon.bandSlices.flatMap((slice) => {
      const found = allSlices.find(
        (s) =>
          s.bandIndex === slice.bandIndex && s.slot.id === slice.slotId && s.wayId === slice.wayId,
      )
      return found ? [found] : []
    })
    if (chain.length === 0) continue

    // Sidepaths: geometry comes only from ribbonPolygon (parallelogram follow kerb/outer).
    if (chain[0]!.slot.zone === 'sidepath') {
      ribbon.points = ribbonPolygon(chain, bands)
      continue
    }

    const head = chain[0]!
    const tail = chain[chain.length - 1]!
    const headBand = bands[head.bandIndex]!

    const isLeftOuter = isOutermostSlice(head, headBand, bands, 'left')
    const isRightOuter = isOutermostSlice(head, headBand, bands, 'right')

    // Synthetic wedge bands own taper geometry — defer to ribbonPolygon.
    if (
      chain.some((s) => bands[s.bandIndex]!.segment.synthetic) ||
      (head.bandIndex > 0 && bands[head.bandIndex - 1]?.segment.synthetic) ||
      (tail.bandIndex < bands.length - 1 && bands[tail.bandIndex + 1]?.segment.synthetic)
    ) {
      ribbon.points = ribbonPolygon(chain, bands)
      continue
    }

    // Lane appears at top of chain (prev band had no corresponding slot).
    if (
      head.bandIndex > 0 &&
      !findCorrespondingInBand(head, head.bandIndex - 1, allSlices, bands, corrBetweenBands) &&
      head.slot.zone === 'carriageway'
    ) {
      const prev = bands[head.bandIndex - 1]!
      // Don't smear ribbons across a dual↔plain seam using travel kerbs (median gap).
      if (isDualPlainSeam(prev, bands[head.bandIndex]!)) {
        ribbon.points = ribbonPolygon(chain, bands)
        continue
      }

      if (isRightOuter && prev.rightKerbX != null && head.rightX > prev.rightKerbX + EPS) {
        const band = bands[head.bandIndex]!
        const topY = round2(band.y)
        const botY = round2(band.y + band.height)
        const taperY = round2(band.y + band.height * TAPER_FRAC)
        ribbon.points = dedupePoints([
          { x: head.leftX, y: topY },
          { x: prev.rightKerbX, y: topY },
          { x: head.rightX, y: taperY },
          { x: head.rightX, y: botY },
          { x: head.leftX, y: botY },
        ])
        continue
      }
      if (isLeftOuter && prev.leftKerbX != null && head.leftX < prev.leftKerbX - EPS) {
        const band = bands[head.bandIndex]!
        const topY = round2(band.y)
        const botY = round2(band.y + band.height)
        const taperY = round2(band.y + band.height * TAPER_FRAC)
        ribbon.points = dedupePoints([
          { x: head.leftX, y: taperY },
          { x: prev.leftKerbX, y: topY },
          { x: head.rightX, y: topY },
          { x: head.rightX, y: botY },
          { x: head.leftX, y: botY },
        ])
        continue
      }
    }

    // Lane disappears at bottom of chain.
    if (
      tail.bandIndex < bands.length - 1 &&
      !findCorrespondingInBand(tail, tail.bandIndex + 1, allSlices, bands, corrBetweenBands) &&
      tail.slot.zone === 'carriageway'
    ) {
      const next = bands[tail.bandIndex + 1]!
      const band = bands[tail.bandIndex]!
      if (isDualPlainSeam(band, next)) {
        // Forward turn pocket that sits over the upcoming dual median → taper to travel hinge.
        const hingeX = next.leftKerbX
        if (
          hingeX != null &&
          next.segment.fork?.dimmedSide === 'left' &&
          (tail.slot.direction === 'forward' ||
            tail.slot.direction === 'both_ways' ||
            tail.slot.turn != null) &&
          tail.leftX < hingeX - EPS &&
          tail.rightX > hingeX - 4
        ) {
          const topY = round2(bands[head.bandIndex]!.y)
          const botY = round2(band.y + band.height)
          const taperY = round2(band.y + band.height * (1 - TAPER_FRAC))
          ribbon.points = dedupePoints([
            { x: tail.leftX, y: topY },
            { x: tail.rightX, y: topY },
            { x: hingeX, y: taperY },
            { x: hingeX, y: botY },
          ])
          continue
        }
        // Opposing lanes above a dual: butt at the seam.
        ribbon.points = ribbonPolygon(chain, bands)
        continue
      }
      const topY = round2(bands[head.bandIndex]!.y)
      const botY = round2(band.y + band.height)
      const taperY = round2(band.y + band.height * (1 - TAPER_FRAC))
      const nextRight = bandRoadOuterX(next, 'right')
      const nextLeft = bandRoadOuterX(next, 'left')

      if (isRightOuter && tail.rightX > nextRight + EPS) {
        ribbon.points = dedupePoints([
          { x: head.leftX, y: topY },
          { x: tail.rightX, y: topY },
          { x: tail.rightX, y: taperY },
          { x: nextRight, y: botY },
          { x: head.leftX, y: botY },
        ])
        continue
      }
      if (isLeftOuter && tail.leftX < nextLeft - EPS) {
        ribbon.points = dedupePoints([
          { x: tail.leftX, y: topY },
          { x: tail.rightX, y: topY },
          { x: tail.rightX, y: botY },
          { x: nextLeft, y: botY },
          { x: tail.leftX, y: taperY },
        ])
        continue
      }
    }

    // Multi-band chain: outer kerb grows toward next band.
    if (
      chain.length >= 2 &&
      isRightOuter &&
      tail.bandIndex < bands.length - 1 &&
      head.slot.zone === 'carriageway'
    ) {
      const next = bands[tail.bandIndex + 1]!
      if (isDualPlainSeam(bands[tail.bandIndex]!, next)) {
        ribbon.points = ribbonPolygon(chain, bands)
        continue
      }
      const nextKerb = bandTravelKerbX(next, 'right')
      if (nextKerb != null && differs(nextKerb, tail.rightX) && nextKerb > tail.rightX + EPS) {
        const band = bands[tail.bandIndex]!
        const topY = round2(bands[head.bandIndex]!.y)
        const botY = round2(band.y + band.height)
        const taperY = round2(band.y + band.height * (1 - TAPER_FRAC))
        ribbon.points = dedupePoints([
          { x: head.leftX, y: topY },
          { x: tail.rightX, y: topY },
          { x: tail.rightX, y: taperY },
          { x: nextKerb, y: botY },
          { x: head.leftX, y: botY },
        ])
        continue
      }
    }

    ribbon.points = ribbonPolygon(chain, bands)
  }
}

/** Build continuous corridor ribbons across segment bands. */
export function buildCorridorRibbons(
  bands: BandGeometry[],
  metersToPx: number,
  extentForBand: (i: number) => { y: number; height: number },
  corrBetweenBands: StackCorrespondence[],
): SceneRibbon[] {
  if (bands.length === 0) return []
  const slices = collectBandSlices(bands, metersToPx, extentForBand, corrBetweenBands)
  const chains = buildChains(slices, bands, corrBetweenBands)
  const ribbons: SceneRibbon[] = []
  for (const chain of chains) {
    const ribbon = chainToRibbon(chain, bands)
    if (ribbon && ribbon.kind !== 'median') ribbons.push(ribbon)
  }
  enrichRibbonTapers(ribbons, bands, metersToPx, slices, corrBetweenBands)
  return ribbons
}

export type CarriagewayPlate = {
  points: Array<{ x: number; y: number }>
}

/** Subtle continuous pavement behind motor/bus — follows kerb edges, not an AABB. */
export function buildCarriagewayPlate(
  bands: BandGeometry[],
  ribbons: SceneRibbon[],
): CarriagewayPlate | null {
  if (bands.length === 0) return null
  const hasMotor = ribbons.some(
    (r) =>
      r.zone === 'carriageway' && (r.kind === 'motor' || r.kind === 'bus') && r.label !== 'sibling',
  )
  if (!hasMotor) return null

  // Square steps at band seams (no diagonal morph). Dual↔plain kerb jumps must not
  // shear a triangle through the bidirectional half of the corridor.
  const left: Array<{ x: number; y: number }> = []
  const right: Array<{ x: number; y: number }> = []
  for (const b of bands) {
    const topY = round2(b.y)
    const botY = round2(b.y + b.height)
    const lx = round2(b.leftKerbX)
    const rx = round2(b.rightKerbX)
    if (left.length === 0 || differs(left[left.length - 1]!.x, lx)) {
      left.push({ x: lx, y: topY })
    }
    left.push({ x: lx, y: botY })
    if (right.length === 0 || differs(right[right.length - 1]!.x, rx)) {
      right.push({ x: rx, y: topY })
    }
    right.push({ x: rx, y: botY })
  }
  right.reverse()
  const points = dedupePoints([...left, ...right])
  if (points.length < 3) return null
  return { points }
}
