import type { CrossSectionSpec } from './cross-section/types'

/**
 * Diagram data for width measure-guide SVGs.
 * Research-scenario metres stay unmarked; teaching figures set `illustrative: true`
 * so the UI captions them (same honesty as research “Tags (illustrative)”).
 * Dimension totals are NEVER hardcoded — the layout sums the spanned bands.
 *
 * Orientation: diagrams with `wayOrientation: true` draw ↑ on travel bands.
 * Diagram-left = OSM `*:left`, diagram-right = `*:right` (way direction up),
 * matching Proposal:Separation / Berlin Radwege double side refs
 * (`cycleway:right:buffer:left` = left side of a right-hand cycleway).
 */

/** Research §3.3 Scenario B metres — sides corrected for way↑ (parking left, cycle right). */
export const roadKerbSpec: CrossSectionSpec = {
  id: 'road-kerb',
  research: '§3.3 Scenario B',
  wayOrientation: true,
  bands: [
    { kind: 'parking', m: 2.0, label: 'parking' },
    { kind: 'motor', m: 3.0, label: 'motor' },
    { kind: 'buffer', m: 1.0, label: 'buffer', hatch: true },
    { kind: 'cycle', m: 2.0, label: 'cycle' },
  ],
  kerbAt: [0, 4],
  dimensions: [
    { from: 0, to: 0, key: 'parking:left:width', side: 'above', row: 0, measure: 'clear' },
    {
      from: 2,
      to: 2,
      key: 'cycleway:right:buffer:left',
      side: 'above',
      row: 0,
      measure: 'inclusive',
    },
    { from: 3, to: 3, key: 'cycleway:right:width', side: 'above', row: 0, measure: 'clear' },
    // One pipe tag over flowing slots only (parking + buffer out of :lanes).
    {
      from: 1,
      to: 3,
      pipeSlots: [1, 3],
      key: 'width:lanes',
      side: 'above',
      row: 1,
      assumption: true,
      measure: 'clear',
    },
    { from: 0, to: 3, key: 'width=*', side: 'below', row: 0, measure: 'inclusive' },
  ],
}

/** `parking=lane` bay inside the carriageway `width=*` span (left of way). */
export const roadParkingLaneSpec: CrossSectionSpec = {
  id: 'road-parking-lane',
  research: '§2.6',
  illustrative: true,
  wayOrientation: true,
  bands: [
    { kind: 'parking', m: 2.0, label: 'parking' },
    { kind: 'motor', m: 6.0, label: 'carriageway' },
  ],
  kerbAt: [0, 2],
  dimensions: [
    { from: 0, to: 0, key: 'parking:left:width', side: 'above', row: 0 },
    { from: 0, to: 1, key: 'width=*', side: 'below', row: 0 },
  ],
}

/** `parking=street_side` bay outside the baseline kerb / outside `width=*` (left of way). */
export const roadParkingStreetSideSpec: CrossSectionSpec = {
  id: 'road-parking-street-side',
  research: '§2.6',
  illustrative: true,
  wayOrientation: true,
  bands: [
    { kind: 'outside', m: 2.0, label: 'street_side' },
    { kind: 'motor', m: 6.0, label: 'carriageway' },
  ],
  kerbAt: [1, 2],
  dimensions: [
    { from: 0, to: 0, key: 'parking:left:width', side: 'above', row: 0 },
    { from: 1, to: 1, key: 'width=*', side: 'below', row: 0 },
  ],
}

/** Two motor slots + centre paint; arrows only on clear bands (§2.2 teaching). */
export const roadWidthLanesSpec: CrossSectionSpec = {
  id: 'road-width-lanes',
  research: '§2.2',
  illustrative: true,
  wayOrientation: true,
  bands: [
    { kind: 'motor', m: 3.0, label: '3.00' },
    { kind: 'paint', m: 0.12 },
    { kind: 'motor', m: 3.0, label: '3.00' },
  ],
  kerbAt: [0, 3],
  dimensions: [
    {
      from: 0,
      to: 2,
      pipeSlots: [0, 2],
      key: 'width:lanes',
      side: 'below',
      row: 0,
      assumption: true,
      measure: 'clear',
    },
  ],
}

/** Research §3.2 Scenario A — paint in `width=*`, excluded from `width:lanes` (assumption). */
export const roadWidthVsLanesSpec: CrossSectionSpec = {
  id: 'road-width-vs-lanes',
  research: '§3.2 Scenario A',
  wayOrientation: true,
  bands: [
    { kind: 'paint', m: 0.12 },
    { kind: 'motor', m: 3.0, label: '3.00' },
    { kind: 'paint', m: 0.12 },
    { kind: 'motor', m: 3.0, label: '3.00' },
    { kind: 'paint', m: 0.12 },
  ],
  kerbAt: [0, 5],
  dimensions: [
    {
      from: 1,
      to: 3,
      pipeSlots: [1, 3],
      key: 'width:lanes',
      side: 'above',
      row: 0,
      assumption: true,
      measure: 'clear',
    },
    { from: 0, to: 4, key: 'width=*', side: 'below', row: 0, showSum: true, measure: 'inclusive' },
  ],
}

/** Cycle clear width between boundary lines (§2.7 / §2.8 clear strip) — right-hand cycleway. */
export const cyclewayClearSpec: CrossSectionSpec = {
  id: 'cycleway-clear',
  research: '§2.7',
  wayOrientation: true,
  bands: [
    { kind: 'paint', m: 0.12 },
    { kind: 'cycle', m: 2.0, label: 'cycle' },
    { kind: 'paint', m: 0.12 },
  ],
  dimensions: [
    { from: 1, to: 1, key: 'cycleway:right:width', side: 'below', row: 0, measure: 'clear' },
  ],
}

/**
 * Research §2.8 ERA buffer package on a **right-hand** cycleway:
 * buffer = 0.12 + 0.63 + 0.25 = 1.00 (paint included); cycle clear = 2.00.
 * `cycleway:right:buffer:left` = left side of that cycleway (toward motor), per Separation.
 */
export const cyclewayBufferSpec: CrossSectionSpec = {
  id: 'cycleway-buffer',
  research: '§2.8',
  wayOrientation: true,
  bands: [
    { kind: 'motor', m: 3.0, label: 'motor' },
    { kind: 'paint', m: 0.12 },
    { kind: 'buffer', m: 0.63, label: 'hatch', hatch: true },
    { kind: 'paint', m: 0.25 },
    { kind: 'cycle', m: 2.0, label: 'cycle' },
  ],
  dimensions: [
    {
      from: 1,
      to: 3,
      key: 'cycleway:right:buffer:left',
      side: 'below',
      row: 0,
      showSum: true,
      measure: 'inclusive',
    },
    { from: 4, to: 4, key: 'cycleway:right:width', side: 'below', row: 0, measure: 'clear' },
  ],
}

/** Research §2.7 segregated path — no marking band (open question §7.1). */
export const pathSegregatedSpec: CrossSectionSpec = {
  id: 'path-segregated',
  research: '§2.7',
  bands: [
    { kind: 'cycle', m: 1.3, label: 'cycle' },
    { kind: 'foot', m: 2.2, label: 'foot' },
  ],
  kerbAt: [0, 2],
  dimensions: [
    { from: 0, to: 0, key: 'cycleway:width', side: 'above', row: 0 },
    { from: 1, to: 1, key: 'footway:width', side: 'above', row: 0 },
    { from: 0, to: 1, key: 'width=*', side: 'below', row: 0 },
  ],
}

/** Typical sidewalk usable width (§2.6) — teaching figure. */
export const sidewalkSpec: CrossSectionSpec = {
  id: 'sidewalk',
  research: '§2.6',
  illustrative: true,
  bands: [{ kind: 'foot', m: 2.0, label: 'sidewalk' }],
  // Randsteine left + right of the paved strip — drawn only; not in `:width`.
  kerbAt: [0, 1],
  dimensions: [{ from: 0, to: 0, key: 'sidewalk:left:width', side: 'below', row: 0 }],
}

/** Verge sits outside carriageway `width=*` (§2.6) — teaching figure. */
export const vergeSpec: CrossSectionSpec = {
  id: 'verge',
  research: '§2.6',
  illustrative: true,
  wayOrientation: true,
  bands: [
    { kind: 'outside', m: 2.0, label: 'sidewalk' },
    { kind: 'verge', m: 1.5, label: 'verge' },
    { kind: 'motor', m: 7.0, label: 'carriageway' },
  ],
  // 0–1: sidewalk Randsteine (not in any `:width`); 2–3: carriageway kerbs.
  kerbAt: [0, 1, 2, 3],
  dimensions: [
    { from: 0, to: 0, key: 'sidewalk:left:width', side: 'above', row: 0 },
    { from: 1, to: 1, key: 'verge:left:width', side: 'above', row: 0 },
    { from: 2, to: 2, key: 'width=*', side: 'below', row: 0 },
  ],
}

/** Generic usable surface on a separate path (§2.1) — teaching figure. */
export const otherPathSpec: CrossSectionSpec = {
  id: 'other-path',
  research: '§2.1',
  illustrative: true,
  bands: [{ kind: 'foot', m: 2.5, label: 'path' }],
  dimensions: [{ from: 0, to: 0, key: 'width=*', side: 'below', row: 0 }],
}

/**
 * Same carriageway: feature `width=*` vs legal `maxwidth` vs physical clearance.
 * Teaching split of a surface (§2.5) — not a research scenario.
 */
export const maxwidthVsWidthSpec: CrossSectionSpec = {
  id: 'maxwidth-vs-width',
  research: '§2.5',
  illustrative: true,
  bands: [
    { kind: 'motor', m: 1.75 },
    { kind: 'motor', m: 2.3, label: 'clear' },
    { kind: 'motor', m: 0.2 },
    { kind: 'motor', m: 1.75 },
  ],
  kerbAt: [0, 4],
  dimensions: [
    { from: 0, to: 3, key: 'width=*', side: 'below', row: 0 },
    { from: 1, to: 2, key: 'maxwidth', side: 'above', row: 0 },
    { from: 1, to: 1, key: 'maxwidth:physical', side: 'above', row: 1 },
  ],
}

/**
 * Same bands as road-kerb; estimate + provenance keys (§2.3).
 * `source:width` is a method string — never show a metre total on that key.
 */
export const estWidthProvenanceSpec: CrossSectionSpec = {
  id: 'est-width-provenance',
  research: '§2.3',
  wayOrientation: true,
  bands: roadKerbSpec.bands,
  kerbAt: roadKerbSpec.kerbAt,
  dimensions: [
    { from: 0, to: 3, key: 'est_width', side: 'below', row: 0 },
    { from: 0, to: 3, key: 'source:width', side: 'above', row: 0, showMetres: false },
  ],
}

/**
 * Full ROW composition — no aggregate OSM key (§3.4).
 * Struck dimension spans everything to show the missing tag. Teaching figure.
 */
export const rowCompositionSpec: CrossSectionSpec = {
  id: 'row-composition',
  research: '§3.4',
  illustrative: true,
  wayOrientation: true,
  bands: [
    { kind: 'outside', m: 2.0, label: 'sidewalk' },
    { kind: 'verge', m: 1.5, label: 'verge' },
    { kind: 'motor', m: 8.0, label: 'carriageway' },
    { kind: 'verge', m: 1.5, label: 'verge' },
    { kind: 'outside', m: 2.0, label: 'sidewalk' },
  ],
  kerbAt: [0, 1, 2, 3, 4, 5],
  dimensions: [
    { from: 0, to: 0, key: 'sidewalk:left:width', side: 'above', row: 0 },
    { from: 1, to: 1, key: 'verge:left:width', side: 'above', row: 0 },
    { from: 2, to: 2, key: 'width=*', side: 'above', row: 0 },
    { from: 3, to: 3, key: 'verge:right:width', side: 'above', row: 0 },
    { from: 4, to: 4, key: 'sidewalk:right:width', side: 'above', row: 0 },
    {
      from: 0,
      to: 4,
      key: 'no aggregate OSM key',
      side: 'below',
      row: 0,
      struck: true,
    },
  ],
}

/** All cross-section specs exported for tests and the audit registry. */
export const allCrossSectionSpecs: readonly CrossSectionSpec[] = [
  roadKerbSpec,
  roadParkingLaneSpec,
  roadParkingStreetSideSpec,
  roadWidthLanesSpec,
  roadWidthVsLanesSpec,
  cyclewayClearSpec,
  cyclewayBufferSpec,
  pathSegregatedSpec,
  sidewalkSpec,
  vergeSpec,
  otherPathSpec,
  maxwidthVsWidthSpec,
  estWidthProvenanceSpec,
  rowCompositionSpec,
]
