export type BandKind =
  | 'motor'
  | 'parking'
  | 'cycle'
  | 'foot'
  | 'buffer'
  | 'verge'
  | 'paint'
  | 'gutter'
  | 'outside'

export type CrossSectionBand = {
  kind: BandKind
  m: number
  label?: string
  hatch?: boolean
  /**
   * Draw an ↑ under the band label: OSM way direction points up the page, so
   * diagram-left = `*:left` and diagram-right = `*:right` (Separation proposal).
   * Defaults to true for `motor` and `cycle` travel bands.
   */
  flowArrow?: boolean
}

/**
 * How dimension ticks attach relative to paint / kerb strokes.
 *
 * - `clear` — usable strip only. Ticks sit on the **inner** face of bounding
 *   paint (or the carriageway-facing kerb face). Paint millimetres stay outside
 *   the arrow. Used for `width:lanes`, `cycleway:*:width`, sidewalk widths.
 * - `inclusive` — package includes its paint. Ticks sit on the **outer** faces
 *   of the first/last paint in the span. Used for `cycleway:*:buffer` and
 *   carriageway `width=*` (kerb face to kerb face; kerb body is drawn outside).
 */
export type MeasureAttach = 'clear' | 'inclusive'

export type CrossSectionDimension = {
  /** First band index, inclusive (extent for stacking when `pipeSlots` unset). */
  from: number
  /** Last band index, inclusive. */
  to: number
  /**
   * Non-contiguous flowing-traffic slots for a single `*:lanes` pipe tag
   * (e.g. motor + bike with a buffer band between them). When set:
   * - label becomes `key=m1|m2|…` from those bands’ metres
   * - arrows are drawn on each slot only (gap bands like buffer are skipped)
   * - `from`/`to` should still bound the slots for row layout
   */
  pipeSlots?: number[]
  /** OSM key label shown on the arrow (e.g. `width=*` or `width:lanes`). */
  key: string
  side: 'above' | 'below'
  /** Stacking row so nested spans do not collide. Defaults to 0. */
  row?: number
  /** Render `= a + b + …` under the arrow (audit density). */
  showSum?: boolean
  /** Footnote `*` marker (research assumption, not established fact). */
  assumption?: boolean
  /** Crossed-out span (e.g. no aggregate ROW key). */
  struck?: boolean
  /**
   * When false, render the key only (no `= N` metre total).
   * Use for non-metric provenance keys like `source:width`. Defaults to true.
   * Ignored when `pipeSlots` is set (pipe form is the metre display).
   */
  showMetres?: boolean
  /**
   * Tick attachment rule. Defaults to `clear` for lane/cycle/sidewalk width keys
   * and `inclusive` otherwise — set explicitly when the default would be wrong.
   */
  measure?: MeasureAttach
}

export type CrossSectionSpec = {
  id: string
  /** Research anchor, e.g. `§3.2 Scenario A`. */
  research: string
  /**
   * Metres are teaching/illustrative — not from a research scenario.
   * UI must caption these so they are not read as sourced facts.
   */
  illustrative?: boolean
  /**
   * Diagram uses OSM left/right relative to way direction (↑ on travel bands).
   * When true, captions explain the orientation convention.
   */
  wayOrientation?: boolean
  bands: CrossSectionBand[]
  /**
   * Band-boundary indices drawn as kerbs (0 = left of first band).
   * Bodies sit outside the measured surface (carriageway or sidewalk) and do
   * not contribute metres to any dimension.
   */
  kerbAt?: number[]
  dimensions: CrossSectionDimension[]
}

export type CrossSectionDensity = 'panel' | 'audit'
