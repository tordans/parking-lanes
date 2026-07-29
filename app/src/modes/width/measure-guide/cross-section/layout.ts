import type {
  CrossSectionBand,
  CrossSectionDensity,
  CrossSectionDimension,
  CrossSectionSpec,
} from './types'

/** Pixels per metre in the SVG viewBox. */
export const PX_PER_M = 44
export const BAND_HEIGHT = 56
export const DIM_ROW_HEIGHT = 18
export const FONT_SIZE = 13
/**
 * Kerb barrier body drawn **outside** the carriageway face.
 * The measurement tick stays on the face (inner / carriageway side);
 * the filled body sits entirely on the sidewalk/verge side so ticks are
 * never centred in the kerb stroke.
 */
export const KERB_BODY_PX = 7
const PAD_X = 20
const PAD_Y = 8
/**
 * Vertical offset from the key label centre to the showSum centre.
 * Matches one DIM_ROW_HEIGHT from the arrow (label sits 6 px off the arrow),
 * plus a little leading so label/sum getBBox pairs of the same dim do not graze.
 */
export const SUM_LABEL_OFFSET = 14
/**
 * Monospace advance as a fraction of font-size. Slightly generous so estimated
 * boxes cover real glyph widths (incl. `=` / `:` / digits).
 */
export const CHAR_WIDTH_FACTOR = 0.68
/** Minimum gap between label boxes on the same row before they count as overlapping. */
export const LABEL_GAP = 4

export type LayoutBand = {
  index: number
  kind: CrossSectionBand['kind']
  m: number
  label?: string
  hatch?: boolean
  flowArrow: boolean
  /** Left edge in viewBox units (true scale). */
  x: number
  /** Width in viewBox units (true scale; paint may render thicker). */
  width: number
  y: number
  height: number
  desaturated: boolean
}

export type LayoutDimension = {
  key: string
  from: number
  to: number
  /** Arrow segments (one per contiguous span or per pipe slot). */
  segments: { x1: number; x2: number }[]
  /** Arrow start x (left of first segment — for label centering). */
  x1: number
  /** Arrow end x (right of last segment). */
  x2: number
  /** Baseline y for the arrow line. */
  y: number
  /** Sum of measured band metres (pipe slots or from–to span). */
  total: number
  /** Individual band metres in measure order (for showSum / pipes). */
  parts: number[]
  /** True when label is `key=m1|m2|…` from pipeSlots. */
  pipeLabel: boolean
  side: 'above' | 'below'
  row: number
  showSum: boolean
  assumption: boolean
  struck: boolean
  /** False for non-metric keys (label is key-only). */
  showMetres: boolean
  /** Clear vs inclusive tick attachment (for legend / reviewers). */
  measure: 'clear' | 'inclusive'
  /** Resolved label string (matches SVG text). */
  labelText: string
  /** Estimated label width in viewBox units. */
  labelWidth: number
  /** Left edge of estimated label box (centred on arrow). */
  labelLeft: number
  /** Right edge of estimated label box. */
  labelRight: number
  /** Arithmetic showSum line (audit only); null when absent. */
  sumText: string | null
  /** Estimated showSum width; 0 when absent. */
  sumWidth: number
  /** Left edge of estimated showSum box; equals labelLeft when absent. */
  sumLeft: number
  /** Right edge of estimated showSum box; equals labelRight when absent. */
  sumRight: number
  /**
   * Stacking row occupied by the showSum line (`assignedRow + 1`).
   * Null when there is no showSum.
   */
  sumRow: number | null
}

export type LayoutKerb = {
  /** Carriageway-facing face x — dimension ticks for width=* attach here. */
  x: number
  /** Which side of `x` the solid kerb body occupies (always outside the carriageway). */
  body: 'left' | 'right'
}

export type CrossSectionLayout = {
  bands: LayoutBand[]
  dimensions: LayoutDimension[]
  kerbs: LayoutKerb[]
  viewBox: { width: number; height: number }
  bandY: number
  bandHeight: number
}

const CARRIAGEWAY_KINDS = new Set(['motor', 'parking', 'cycle', 'buffer', 'paint', 'gutter'])
/** Walkable sidewalk / foot strip — Randsteine frame these; body sits outside. */
const SIDEWALK_LIKE_KINDS = new Set(['foot', 'outside'])

/**
 * Which side of a kerb boundary the solid body occupies — always **outside**
 * the measured surface so the face line is the measure edge.
 *
 * - Carriageway kerbs: body outside the motor/parking/cycle strip.
 * - Sidewalk Randsteine: body outside the foot / sidewalk band (not counted in
 *   any `:width` — they take no band metres).
 */
export function kerbBodySide(
  bands: readonly CrossSectionBand[],
  boundary: number,
): 'left' | 'right' {
  if (boundary <= 0) return 'left'
  if (boundary >= bands.length) return 'right'

  const leftBand = bands[boundary - 1]!
  const rightBand = bands[boundary]!
  const leftCarriage = CARRIAGEWAY_KINDS.has(leftBand.kind)
  const rightCarriage = CARRIAGEWAY_KINDS.has(rightBand.kind)

  // Direct carriageway face (prefer immediate neighbours).
  if (leftCarriage && !rightCarriage) return 'right'
  if (rightCarriage && !leftCarriage) return 'left'

  // Sidewalk edging (Randsteine): body outside the walkable band.
  const leftWalk = SIDEWALK_LIKE_KINDS.has(leftBand.kind)
  const rightWalk = SIDEWALK_LIKE_KINDS.has(rightBand.kind)
  if (leftWalk && !rightWalk) return 'right'
  if (rightWalk && !leftWalk) return 'left'

  // Fall back: carriageway somewhere on one side of this cut.
  const leftHasCarriage = bands.slice(0, boundary).some((b) => CARRIAGEWAY_KINDS.has(b.kind))
  const rightHasCarriage = bands.slice(boundary).some((b) => CARRIAGEWAY_KINDS.has(b.kind))
  if (leftHasCarriage && !rightHasCarriage) return 'right'
  if (rightHasCarriage && !leftHasCarriage) return 'left'

  // Both or neither: body away from the diagram centre.
  return boundary <= bands.length / 2 ? 'left' : 'right'
}

/** Default measure attach from the OSM key when `measure` is omitted. */
export function defaultMeasureAttach(key: string): 'clear' | 'inclusive' {
  if (key.includes('buffer')) return 'inclusive'
  if (key === 'width=*' || key === 'est_width') return 'inclusive'
  if (key === 'maxwidth' || key === 'maxwidth:physical') return 'inclusive'
  if (key === 'width:lanes') return 'clear'
  // Side / path strip widths: clear of bounding paint when paint is present.
  if (key.endsWith(':width') || key === 'cycleway:width' || key === 'footway:width') return 'clear'
  return 'inclusive'
}

/** Sum metres of bands from `from` through `to` inclusive. */
export function sumBandMetres(
  bands: readonly CrossSectionBand[],
  from: number,
  to: number,
): number {
  let total = 0
  for (let i = from; i <= to; i++) {
    total += bands[i]!.m
  }
  return total
}

/** Metres of each band in the inclusive span, in order. */
export function bandParts(bands: readonly CrossSectionBand[], from: number, to: number): number[] {
  const parts: number[] = []
  for (let i = from; i <= to; i++) {
    parts.push(bands[i]!.m)
  }
  return parts
}

/** Left edge x of band `index` in content coordinates (before PAD_X). */
export function bandContentX(bands: readonly CrossSectionBand[], index: number): number {
  let x = 0
  for (let i = 0; i < index; i++) {
    x += bands[i]!.m * PX_PER_M
  }
  return x
}

export function totalContentWidth(bands: readonly CrossSectionBand[]): number {
  return bands.reduce((sum, b) => sum + b.m * PX_PER_M, 0)
}

/** Format a metre value for SVG labels (no unit suffix). */
export function formatMetres(m: number): string {
  const rounded = Math.round(m * 100) / 100
  if (Number.isInteger(rounded)) return String(rounded)
  const asTwo = rounded.toFixed(2)
  if (asTwo.endsWith('0')) return rounded.toFixed(1)
  return asTwo
}

/** Format the showSum arithmetic line, e.g. `= 3 + 3 + 0.12 + 0.12 + 0.12`. */
export function formatSumExpression(parts: readonly number[]): string {
  return `= ${parts.map(formatMetres).join(' + ')}`
}

/** Format a `*:lanes` pipe value, e.g. `3|2`. */
export function formatPipeMetres(parts: readonly number[]): string {
  return parts.map(formatMetres).join('|')
}

/** Estimate rendered text width from character count (no DOM). */
export function estimateTextWidth(text: string, fontSize: number = FONT_SIZE): number {
  return text.length * fontSize * CHAR_WIDTH_FACTOR
}

/** Label string shown on a dimension arrow (matches CrossSection renderer). */
export function dimensionLabelText(dim: {
  key: string
  total: number
  parts: readonly number[]
  pipeLabel: boolean
  assumption: boolean
  struck: boolean
  showMetres: boolean
}): string {
  const marker = dim.assumption ? '*' : ''
  if (dim.struck || !dim.showMetres) return `${dim.key}${marker}`
  if (dim.pipeLabel) return `${dim.key}=${formatPipeMetres(dim.parts)}${marker}`
  // OSM tag form: `width=*` + metres → `width=7` (not `width=* = 7`).
  const keyBase = dim.key.endsWith('=*') ? dim.key.slice(0, -2) : dim.key
  return `${keyBase}=${formatMetres(dim.total)}${marker}`
}

/** Inclusive band edges in content coords + optional pad (before shiftX). */
export function bandSegment(
  bands: readonly CrossSectionBand[],
  index: number,
  padX: number = 0,
): { x1: number; x2: number } {
  const x1 = padX + bandContentX(bands, index)
  return { x1, x2: x1 + bands[index]!.m * PX_PER_M }
}

function dimensionVisible(dim: CrossSectionDimension, density: CrossSectionDensity): boolean {
  // Panel keeps only primary (hint row 0) dimensions; collision may still stack them.
  if (density === 'panel' && (dim.row ?? 0) >= 1) return false
  return true
}

function boxesOverlap(aLeft: number, aRight: number, bLeft: number, bRight: number): boolean {
  return aLeft < bRight + LABEL_GAP && bLeft < aRight + LABEL_GAP
}

type PendingDim = {
  dim: CrossSectionDimension
  total: number
  parts: number[]
  pipeLabel: boolean
  segments: { x1: number; x2: number }[]
  x1: number
  x2: number
  showSum: boolean
  assumption: boolean
  struck: boolean
  showMetres: boolean
  measure: 'clear' | 'inclusive'
  labelText: string
  labelWidth: number
  labelLeft: number
  labelRight: number
  sumText: string | null
  sumWidth: number
  sumLeft: number
  sumRight: number
  /** Inclusive horizontal extent for padding (label + optional showSum). */
  extentLeft: number
  extentRight: number
  hintRow: number
  assignedRow: number
}

type PlacedBox = { row: number; left: number; right: number }

/**
 * Assign stacking rows so same-side label and showSum boxes do not overlap.
 * Explicit `row` is a minimum / starting hint; collisions push onto later rows.
 *
 * A showSum line is first-class:
 * - its width widens the parent’s footprint on `assignedRow` (so same-row
 *   neighbours cannot sit under a wide arithmetic line), and
 * - it also reserves `assignedRow + 1` so later dimensions stack clear of it.
 * Self label/sum pairs are intentionally stacked and never compared.
 */
export function assignDimensionRows(pending: PendingDim[]): void {
  const bySide: Record<'above' | 'below', PendingDim[]> = { above: [], below: [] }
  for (const p of pending) {
    bySide[p.dim.side].push(p)
  }

  for (const side of ['above', 'below'] as const) {
    const list = bySide[side]
    list.sort((a, b) => a.hintRow - b.hintRow || a.dim.from - b.dim.from || a.dim.to - b.dim.to)

    const placed: PlacedBox[] = []
    for (const item of list) {
      let row = item.hintRow
      while (
        placed.some(
          (p) => p.row === row && boxesOverlap(p.left, p.right, item.extentLeft, item.extentRight),
        ) ||
        (item.showSum &&
          placed.some(
            (p) => p.row === row + 1 && boxesOverlap(p.left, p.right, item.sumLeft, item.sumRight),
          ))
      ) {
        row += 1
      }
      item.assignedRow = row
      // Footprint on the label row includes showSum width so neighbours clear it.
      placed.push({ row, left: item.extentLeft, right: item.extentRight })
      if (item.showSum) {
        placed.push({ row: row + 1, left: item.sumLeft, right: item.sumRight })
      }
    }
  }
}

/**
 * Pure layout: metres → viewBox geometry. Dimension totals are always
 * computed from the bands they span — never taken from literals in the spec.
 */
export function crossSectionLayout(
  spec: CrossSectionSpec,
  density: CrossSectionDensity = 'audit',
): CrossSectionLayout {
  const { bands, dimensions, kerbAt = [] } = spec
  const contentWidth = totalContentWidth(bands)

  const visibleDims = dimensions.filter((d) => dimensionVisible(d, density))

  // First pass: arrow geometry at nominal PAD_X; label boxes centred on spans.
  const pending: PendingDim[] = visibleDims.map((dim) => {
    const slots = dim.pipeSlots
    const pipeLabel = Boolean(slots && slots.length > 0)
    const parts = pipeLabel ? slots!.map((i) => bands[i]!.m) : bandParts(bands, dim.from, dim.to)
    const total = parts.reduce((sum, m) => sum + m, 0)
    const segments = pipeLabel
      ? slots!.map((i) => bandSegment(bands, i, PAD_X))
      : [
          {
            x1: PAD_X + bandContentX(bands, dim.from),
            x2: PAD_X + bandContentX(bands, dim.to) + bands[dim.to]!.m * PX_PER_M,
          },
        ]
    const x1 = segments[0]!.x1
    const x2 = segments[segments.length - 1]!.x2
    const assumption = Boolean(dim.assumption)
    const struck = Boolean(dim.struck)
    // Pipe labels always carry metres in the pipe list.
    const showMetres = pipeLabel ? true : dim.showMetres !== false
    const measure = dim.measure ?? defaultMeasureAttach(dim.key)
    const showSum = Boolean(dim.showSum) && density === 'audit'
    const labelText = dimensionLabelText({
      key: dim.key,
      total,
      parts,
      pipeLabel,
      assumption,
      struck,
      showMetres,
    })
    const labelWidth = estimateTextWidth(labelText, FONT_SIZE)
    const midX = (x1 + x2) / 2
    const labelLeft = midX - labelWidth / 2
    const labelRight = midX + labelWidth / 2
    const sumText = showSum ? formatSumExpression(parts) : null
    const sumWidth = sumText ? estimateTextWidth(sumText, FONT_SIZE - 2) : 0
    const sumLeft = showSum ? midX - sumWidth / 2 : labelLeft
    const sumRight = showSum ? midX + sumWidth / 2 : labelRight

    return {
      dim,
      total,
      parts,
      pipeLabel,
      segments,
      x1,
      x2,
      showSum,
      assumption,
      struck,
      showMetres,
      measure,
      labelText,
      labelWidth,
      labelLeft,
      labelRight,
      sumText,
      sumWidth,
      sumLeft,
      sumRight,
      extentLeft: Math.min(labelLeft, sumLeft),
      extentRight: Math.max(labelRight, sumRight),
      hintRow: dim.row ?? 0,
      assignedRow: dim.row ?? 0,
    }
  })

  assignDimensionRows(pending)

  // showSum occupies assignedRow + 1; height must cover that outer row.
  const aboveMax = pending.reduce((max, p) => {
    if (p.dim.side !== 'above') return max
    const outer = p.assignedRow + (p.showSum ? 1 : 0)
    return Math.max(max, outer)
  }, -1)
  const belowMax = pending.reduce((max, p) => {
    if (p.dim.side !== 'below') return max
    const outer = p.assignedRow + (p.showSum ? 1 : 0)
    return Math.max(max, outer)
  }, -1)
  const aboveRows = aboveMax >= 0 ? aboveMax + 1 : 0
  const belowRows = belowMax >= 0 ? belowMax + 1 : 0

  const aboveBlock = aboveRows * DIM_ROW_HEIGHT
  const bandY = PAD_Y + aboveBlock
  const belowBlock = belowRows * DIM_ROW_HEIGHT

  const viewHeight = bandY + BAND_HEIGHT + belowBlock + PAD_Y
  let viewWidth = contentWidth + PAD_X * 2

  // Grow the canvas (not the scale) so estimated label/sum boxes stay inside the viewBox.
  let minExtent = 0
  let maxExtent = viewWidth
  for (const p of pending) {
    minExtent = Math.min(minExtent, p.extentLeft)
    maxExtent = Math.max(maxExtent, p.extentRight)
  }
  const shiftX = minExtent < 0 ? -minExtent : 0
  viewWidth = maxExtent + shiftX

  const layoutBands: LayoutBand[] = bands.map((band, index) => {
    const x = PAD_X + shiftX + bandContentX(bands, index)
    const width = band.m * PX_PER_M
    const flowArrow = band.flowArrow ?? (band.kind === 'motor' || band.kind === 'cycle')
    return {
      index,
      kind: band.kind,
      m: band.m,
      label: band.label,
      hatch: band.hatch,
      flowArrow,
      x,
      width,
      y: bandY,
      height: BAND_HEIGHT,
      desaturated: band.kind === 'outside',
    }
  })

  const layoutDimensions: LayoutDimension[] = pending.map((p) => {
    const row = p.assignedRow
    const x1 = p.x1 + shiftX
    const x2 = p.x2 + shiftX
    const segments = p.segments.map((s) => ({ x1: s.x1 + shiftX, x2: s.x2 + shiftX }))
    const labelLeft = p.labelLeft + shiftX
    const labelRight = p.labelRight + shiftX
    const sumLeft = p.sumLeft + shiftX
    const sumRight = p.sumRight + shiftX

    let y: number
    if (p.dim.side === 'above') {
      // row 0 closest to the band
      y = bandY - DIM_ROW_HEIGHT * (row + 0.5)
    } else {
      y = bandY + BAND_HEIGHT + DIM_ROW_HEIGHT * (row + 0.5)
    }

    return {
      key: p.dim.key,
      from: p.dim.from,
      to: p.dim.to,
      segments,
      x1,
      x2,
      y,
      total: p.total,
      parts: p.parts,
      pipeLabel: p.pipeLabel,
      side: p.dim.side,
      row,
      showSum: p.showSum,
      assumption: p.assumption,
      struck: p.struck,
      showMetres: p.showMetres,
      measure: p.measure,
      labelText: p.labelText,
      labelWidth: p.labelWidth,
      labelLeft,
      labelRight,
      sumText: p.sumText,
      sumWidth: p.sumWidth,
      sumLeft,
      sumRight,
      sumRow: p.showSum ? row + 1 : null,
    }
  })

  // Boundary index i = left edge of band i; index bands.length = right of last band.
  // Kerb body sits entirely outside the carriageway face so ticks land on the face.
  const kerbs: LayoutKerb[] = kerbAt.map((boundary) => {
    const contentX =
      boundary >= bands.length ? contentWidth : bandContentX(bands, Math.max(0, boundary))
    return {
      x: PAD_X + shiftX + contentX,
      body: kerbBodySide(bands, boundary),
    }
  })

  // Ensure kerb bodies are not clipped by the viewBox.
  let kerbPadLeft = 0
  let kerbPadRight = 0
  for (const kerb of kerbs) {
    if (kerb.body === 'left') {
      kerbPadLeft = Math.max(kerbPadLeft, KERB_BODY_PX + 2 - kerb.x)
    } else {
      kerbPadRight = Math.max(kerbPadRight, kerb.x + KERB_BODY_PX + 2 - viewWidth)
    }
  }
  if (kerbPadLeft > 0 || kerbPadRight > 0) {
    for (const band of layoutBands) {
      band.x += kerbPadLeft
    }
    for (const dim of layoutDimensions) {
      dim.x1 += kerbPadLeft
      dim.x2 += kerbPadLeft
      for (const seg of dim.segments) {
        seg.x1 += kerbPadLeft
        seg.x2 += kerbPadLeft
      }
      dim.labelLeft += kerbPadLeft
      dim.labelRight += kerbPadLeft
      dim.sumLeft += kerbPadLeft
      dim.sumRight += kerbPadLeft
    }
    for (const kerb of kerbs) {
      kerb.x += kerbPadLeft
    }
    viewWidth += kerbPadLeft + kerbPadRight
  }

  return {
    bands: layoutBands,
    dimensions: layoutDimensions,
    kerbs,
    viewBox: { width: viewWidth, height: viewHeight },
    bandY,
    bandHeight: BAND_HEIGHT,
  }
}
