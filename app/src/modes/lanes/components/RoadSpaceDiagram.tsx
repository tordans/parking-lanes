import type {
  RoadSpaceDirection,
  RoadSpaceScene,
  RoadSpaceSlotKind,
  RoadSpaceZone,
  ScenePolyline,
  SceneSlotRect,
  SceneSlotRectKind,
  SeparatelyMappedSidepath,
} from '@osm-editor-kit/osm-lane-diagram'
import { type ReactElement } from 'react'

/**
 * Palette aligned with width-guide BAND_STYLE + lanes map chrome.
 * Carriageway motor is cool zinc; sidewalks are warmer and lighter so zones separate at a glance.
 */
const COLORS = {
  motor: '#a1a1aa', // zinc-400 — carriageway travel (width-guide motor)
  bus: '#fde68a', // amber-200
  cycle: '#5eead4', // teal-300 — width-guide cycle
  both_ways: '#fda4af', // rose-300
  sidewalk: '#f5f5f4', // stone-100 — warm, lighter than carriageway
  shared_path: '#a7f3d0', // emerald-200 — between cycle and sidewalk
  median: '#d6d3d1', // stone-300 — island, distinct from travel slots
  sibling: '#e4e4e7', // zinc-200 — opposite carriageway placeholder
  motorUntagged: '#c4c4c8',
  busUntagged: '#fef3c7',
  cycleUntagged: '#99f6e4',
  both_waysUntagged: '#fecdd3',
  sidewalkUntagged: '#e7e5e4',
  shared_pathUntagged: '#d1fae5',
  kerb: '#44403c', // stone-700
  outer_edge: '#a8a29e', // stone-400 — lighter than kerb
  separator: '#71717a', // zinc-500
  centreline: '#3f3f46', // zinc-700
  segment_boundary: '#d4d4d8', // zinc-300 hairline
  highlight: '#2563eb', // blue-600
  highlightStroke: '#1d4ed8', // blue-700
  untaggedEdge: '#a1a1aa',
  bandTint: '#f4f4f5', // zinc-100
  bandTintCurrent: '#ffffff',
  arrow: '#3f3f46',
  turn: '#18181b',
  widthLabel: '#27272a',
  siblingLabel: '#52525b',
} as const

function kindFill(kind: SceneSlotRectKind, tagged: boolean): string {
  if (kind === 'median') return COLORS.median
  if (tagged) {
    return COLORS[kind]
  }
  switch (kind) {
    case 'motor':
      return COLORS.motorUntagged
    case 'bus':
      return COLORS.busUntagged
    case 'cycle':
      return COLORS.cycleUntagged
    case 'both_ways':
      return COLORS.both_waysUntagged
    case 'sidewalk':
      return COLORS.sidewalkUntagged
    case 'shared_path':
      return COLORS.shared_pathUntagged
  }
}

function polylineStroke(line: ScenePolyline): string {
  switch (line.kind) {
    case 'kerb':
      return COLORS.kerb
    case 'outer_edge':
      return COLORS.outer_edge
    case 'centreline':
      return COLORS.centreline
    case 'segment_boundary':
      return COLORS.segment_boundary
    default:
      return COLORS.separator
  }
}

function polylineStrokeWidth(line: ScenePolyline): number {
  switch (line.kind) {
    case 'kerb':
      return 2.25
    case 'outer_edge':
      return 1.25
    case 'segment_boundary':
      return 0.75
    case 'centreline':
      return 1.25
    default:
      return 1.5
  }
}

function pointsAttr(points: Array<{ x: number; y: number }>): string {
  return points.map((p) => `${p.x},${p.y}`).join(' ')
}

function formatWidthLabel(widthM: number): string {
  if (Number.isInteger(widthM)) return `${widthM}`
  return widthM.toFixed(1)
}

/**
 * OSM way direction points **up** the page (same as /audit-width), so
 * diagram-left = `*:left`. forward → ↑, backward → ↓, both_ways → ↕.
 */
function DirectionHint({
  direction,
  cx,
  cy,
  size,
}: {
  direction: RoadSpaceDirection
  cx: number
  cy: number
  size: number
}): ReactElement | null {
  if (direction === 'none') return null
  const half = size / 2
  const stroke = COLORS.arrow

  if (direction === 'both_ways') {
    return (
      <g opacity={0.75} pointerEvents="none">
        <polyline
          fill="none"
          stroke={stroke}
          strokeWidth={1.25}
          strokeLinecap="round"
          strokeLinejoin="round"
          points={`${cx},${cy + half} ${cx},${cy - half}`}
        />
        <polyline
          fill="none"
          stroke={stroke}
          strokeWidth={1.25}
          strokeLinecap="round"
          strokeLinejoin="round"
          points={`${cx - half * 0.55},${cy - half * 0.35} ${cx},${cy - half} ${cx + half * 0.55},${cy - half * 0.35}`}
        />
        <polyline
          fill="none"
          stroke={stroke}
          strokeWidth={1.25}
          strokeLinecap="round"
          strokeLinejoin="round"
          points={`${cx - half * 0.55},${cy + half * 0.35} ${cx},${cy + half} ${cx + half * 0.55},${cy + half * 0.35}`}
        />
      </g>
    )
  }

  // forward = up-page (↑); backward = down-page (↓)
  const tipY = direction === 'forward' ? cy - half : cy + half
  const baseY = direction === 'forward' ? cy + half * 0.35 : cy - half * 0.35
  const headSign = direction === 'forward' ? 1 : -1
  return (
    <g opacity={0.75} pointerEvents="none">
      <polyline
        fill="none"
        stroke={stroke}
        strokeWidth={1.25}
        strokeLinecap="round"
        strokeLinejoin="round"
        points={`${cx},${baseY} ${cx},${tipY}`}
      />
      <polyline
        fill="none"
        stroke={stroke}
        strokeWidth={1.25}
        strokeLinecap="round"
        strokeLinejoin="round"
        points={`${cx - half * 0.55},${tipY + headSign * half * 0.45} ${cx},${tipY} ${cx + half * 0.55},${tipY + headSign * half * 0.45}`}
      />
    </g>
  )
}

function turnGlyphFlipTransform(
  direction: RoadSpaceDirection,
  cx: number,
  cy: number,
): string | undefined {
  if (direction !== 'backward') return undefined
  // Mirror forward-oriented glyphs so through/right match backward travel (↓ on the page).
  return `translate(${cx} ${cy}) scale(1 -1) translate(${-cx} ${-cy})`
}

function turnGlyphPaths(
  turn: string,
  direction: RoadSpaceDirection,
  cx: number,
  cy: number,
  size: number,
): ReactElement | null {
  const tokens = turn
    .split(';')
    .map((t) => t.trim())
    .filter(Boolean)
  if (tokens.length === 0) return null

  const half = size / 2
  const stroke = COLORS.turn
  const elements: ReactElement[] = []

  for (const token of tokens) {
    if (token === 'through' || token === 'none') {
      elements.push(
        <polyline
          key={`${token}-through`}
          fill="none"
          stroke={stroke}
          strokeWidth={1.35}
          strokeLinecap="round"
          strokeLinejoin="round"
          points={`${cx},${cy + half} ${cx},${cy - half}`}
        />,
      )
      elements.push(
        <polyline
          key={`${token}-through-head`}
          fill="none"
          stroke={stroke}
          strokeWidth={1.35}
          strokeLinecap="round"
          strokeLinejoin="round"
          points={`${cx - half * 0.45},${cy - half * 0.35} ${cx},${cy - half} ${cx + half * 0.45},${cy - half * 0.35}`}
        />,
      )
      continue
    }
    if (token === 'left' || token === 'sharp_left' || token === 'slight_left') {
      const bend = token === 'slight_left' ? 0.55 : 0.85
      elements.push(
        <path
          key={token}
          fill="none"
          stroke={stroke}
          strokeWidth={1.35}
          strokeLinecap="round"
          strokeLinejoin="round"
          d={`M ${cx} ${cy + half} L ${cx} ${cy} Q ${cx} ${cy - half * bend} ${cx - half} ${cy - half * bend}`}
        />,
      )
      elements.push(
        <polyline
          key={`${token}-head`}
          fill="none"
          stroke={stroke}
          strokeWidth={1.35}
          strokeLinecap="round"
          strokeLinejoin="round"
          points={`${cx - half + half * 0.35},${cy - half * bend - half * 0.35} ${cx - half},${cy - half * bend} ${cx - half + half * 0.35},${cy - half * bend + half * 0.35}`}
        />,
      )
      continue
    }
    if (token === 'right' || token === 'sharp_right' || token === 'slight_right') {
      const bend = token === 'slight_right' ? 0.55 : 0.85
      elements.push(
        <path
          key={token}
          fill="none"
          stroke={stroke}
          strokeWidth={1.35}
          strokeLinecap="round"
          strokeLinejoin="round"
          d={`M ${cx} ${cy + half} L ${cx} ${cy} Q ${cx} ${cy - half * bend} ${cx + half} ${cy - half * bend}`}
        />,
      )
      elements.push(
        <polyline
          key={`${token}-head`}
          fill="none"
          stroke={stroke}
          strokeWidth={1.35}
          strokeLinecap="round"
          strokeLinejoin="round"
          points={`${cx + half - half * 0.35},${cy - half * bend - half * 0.35} ${cx + half},${cy - half * bend} ${cx + half - half * 0.35},${cy - half * bend + half * 0.35}`}
        />,
      )
      continue
    }
    if (token === 'reverse' || token === 'merge_to_left' || token === 'merge_to_right') {
      elements.push(
        <text
          key={token}
          x={cx}
          y={cy + 3}
          textAnchor="middle"
          fontSize={Math.max(8, size * 0.7)}
          fill={stroke}
          fontFamily="ui-sans-serif, system-ui, sans-serif"
        >
          {token === 'reverse' ? '↩' : token.startsWith('merge_to_left') ? '↖' : '↗'}
        </text>,
      )
    }
  }

  if (elements.length === 0) return null
  return (
    <g opacity={0.9} pointerEvents="none" transform={turnGlyphFlipTransform(direction, cx, cy)}>
      {elements}
    </g>
  )
}

function SiblingPlaceholderLabel({
  rect,
  siblingLabel,
  cx,
  cy,
}: {
  rect: SceneSlotRect
  siblingLabel: string
  cx: number
  cy: number
}): ReactElement | null {
  if (rect.width < 12 || rect.height < 28) return null
  // Rotated along the band; textLength constrains the glyph run to the band height.
  const maxGlyphRun = Math.max(24, rect.height - 14)
  const fontSize = Math.min(8, Math.max(5.5, rect.width * 0.22))
  return (
    <text
      x={cx}
      y={cy}
      textAnchor="middle"
      dominantBaseline="middle"
      fontSize={fontSize}
      fill={COLORS.siblingLabel}
      fontFamily="ui-sans-serif, system-ui, sans-serif"
      transform={`rotate(-90 ${cx} ${cy})`}
      textLength={maxGlyphRun}
      lengthAdjust="spacingAndGlyphs"
    >
      {siblingLabel}
    </text>
  )
}

function SlotRect({
  rect,
  highlightedSlotId,
  metersToPx,
  siblingLabel,
}: {
  rect: SceneSlotRect
  highlightedSlotId?: string | null
  metersToPx: number
  siblingLabel: string
}): ReactElement {
  const hasHighlight = highlightedSlotId != null && highlightedSlotId !== ''
  const isHighlighted = hasHighlight && rect.slotId === highlightedSlotId
  const isSiblingDimmed = hasHighlight && !isHighlighted
  const isMedian = rect.kind === 'median'
  const isSibling = rect.label === 'sibling'
  const isStepFill = rect.label === 'step_fill'
  const isTagged = rect.widthProvenance === 'tagged'
  const zone: RoadSpaceZone = rect.zone
  const fill = isSibling ? COLORS.sibling : kindFill(rect.kind, isTagged)
  const cx = rect.x + rect.width / 2
  const cy = rect.y + rect.height / 2
  const glyphSize = Math.min(rect.width, rect.height) * 0.42
  const opacity = rect.dimmed || isSiblingDimmed ? 0.4 : 1
  const widthM = metersToPx > 0 ? rect.width / metersToPx : undefined
  const inset = 2
  const hasTravelGlyph =
    !isMedian &&
    !isSibling &&
    !isStepFill &&
    (rect.kind === 'motor' ||
      rect.kind === 'bus' ||
      rect.kind === 'cycle' ||
      rect.kind === 'both_ways')

  return (
    <g opacity={opacity} pointerEvents="none">
      <rect
        x={rect.x}
        y={rect.y}
        width={rect.width}
        height={rect.height}
        fill={fill}
        stroke={isHighlighted ? COLORS.highlightStroke : 'none'}
        strokeWidth={isHighlighted ? 2.5 : 0}
        opacity={zone === 'sidepath' && isTagged ? 0.95 : 1}
        shapeRendering="crispEdges"
      />
      {/* Untagged width: vertical dotted edges only — no full rectangle (avoids per-band boxes). */}
      {!isTagged &&
      !isMedian &&
      !isSibling &&
      !isStepFill &&
      rect.width > inset * 2 &&
      rect.height > inset * 2 ? (
        <g
          fill="none"
          stroke={COLORS.untaggedEdge}
          strokeWidth={1}
          strokeDasharray="1.25 2.25"
          opacity={0.85}
        >
          <line
            x1={rect.x + inset}
            y1={rect.y + inset}
            x2={rect.x + inset}
            y2={rect.y + rect.height - inset}
          />
          <line
            x1={rect.x + rect.width - inset}
            y1={rect.y + inset}
            x2={rect.x + rect.width - inset}
            y2={rect.y + rect.height - inset}
          />
        </g>
      ) : null}
      {isSibling ? (
        <SiblingPlaceholderLabel rect={rect} siblingLabel={siblingLabel} cx={cx} cy={cy} />
      ) : null}
      {isTagged &&
      !isMedian &&
      !isSibling &&
      !isStepFill &&
      widthM != null &&
      rect.width >= 18 &&
      rect.height >= 14 ? (
        <text
          x={cx}
          y={cy + (rect.turn || hasTravelGlyph ? glyphSize * 0.55 : 0)}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={Math.min(10, Math.max(7, rect.width * 0.22))}
          fill={COLORS.widthLabel}
          opacity={0.8}
          fontFamily="ui-sans-serif, system-ui, sans-serif"
        >
          {formatWidthLabel(widthM)}
        </text>
      ) : null}
      {rect.turn && !isMedian && !isSibling ? (
        turnGlyphPaths(
          rect.turn,
          rect.direction,
          cx,
          cy - (isTagged ? 4 : 0),
          Math.max(10, glyphSize),
        )
      ) : hasTravelGlyph ? (
        <DirectionHint
          direction={rect.direction}
          cx={cx}
          cy={cy - (isTagged ? 4 : 0)}
          size={Math.max(8, glyphSize * 0.85)}
        />
      ) : null}
    </g>
  )
}

/**
 * Render-only plan-sketch diagram. No hit-testing, no focusable children,
 * no stores — callers drive `highlightedSlotId` from the form.
 *
 * Sized at the scene’s natural pixel size (`widthPx`×`heightPx`); CSS may shrink
 * with `max-width: 100%` but must not stretch beyond 1:1 (shared metre scale).
 */
export function RoadSpaceDiagram({
  scene,
  ariaLabel,
  highlightedSlotId,
  className,
  siblingLabel = 'Opposite carriageway',
}: {
  scene: RoadSpaceScene
  ariaLabel: string
  highlightedSlotId?: string | null
  className?: string
  /** Label drawn inside `label: 'sibling'` placeholder rects. */
  siblingLabel?: string
}): ReactElement {
  return (
    <svg
      role="img"
      aria-label={ariaLabel}
      className={className}
      width={scene.widthPx}
      height={scene.heightPx}
      viewBox={`0 0 ${scene.widthPx} ${scene.heightPx}`}
      preserveAspectRatio="xMidYMin meet"
      style={{
        pointerEvents: 'none',
        width: scene.widthPx,
        maxWidth: '100%',
        height: 'auto',
        display: 'block',
      }}
    >
      {scene.bands.map((band) => (
        <rect
          key={`band-${band.role}-${band.wayId}`}
          x={0}
          y={band.y}
          width={scene.widthPx}
          height={band.height}
          fill={band.role === 'current' ? COLORS.bandTintCurrent : COLORS.bandTint}
          opacity={band.dimmed ? 0.45 : 0.85}
        />
      ))}

      {scene.polylines
        .filter((line) => line.kind === 'segment_boundary')
        .map((line) => (
          <polyline
            key={line.id}
            fill="none"
            stroke={polylineStroke(line)}
            strokeWidth={polylineStrokeWidth(line)}
            points={pointsAttr(line.points)}
          />
        ))}

      {scene.slotRects.map((rect) => (
        <SlotRect
          key={rect.slotId}
          rect={rect}
          highlightedSlotId={highlightedSlotId}
          metersToPx={scene.metersToPx}
          siblingLabel={siblingLabel}
        />
      ))}

      {scene.polylines
        .filter((line) => line.kind !== 'segment_boundary')
        .map((line) => (
          <polyline
            key={line.id}
            fill="none"
            stroke={polylineStroke(line)}
            strokeWidth={polylineStrokeWidth(line)}
            strokeDasharray={line.style === 'dashed' ? '4 3' : undefined}
            points={pointsAttr(line.points)}
          />
        ))}
    </svg>
  )
}

/** Swatch colours for legend UIs (editor + audit). */
export const ROAD_SPACE_KIND_SWATCH: Record<RoadSpaceSlotKind, string> = {
  motor: COLORS.motor,
  bus: COLORS.bus,
  cycle: COLORS.cycle,
  both_ways: COLORS.both_ways,
  sidewalk: COLORS.sidewalk,
  shared_path: COLORS.shared_path,
}

export const ROAD_SPACE_MEDIAN_SWATCH = COLORS.median
export const ROAD_SPACE_SIBLING_SWATCH = COLORS.sibling

/** English notes for `/audit-lanes` (no paraglide). Dedupes across chain segments. */
export function separatelyMappedNotesEn(hints: SeparatelyMappedSidepath[] | undefined): string[] {
  if (!hints || hints.length === 0) return []
  const seen = new Set<string>()
  const notes: string[] = []
  for (const h of hints) {
    const key = `${h.prefix}:${h.side}`
    if (seen.has(key)) continue
    seen.add(key)
    const side = h.side === 'left' ? 'Left' : 'Right'
    const feature = h.prefix === 'sidewalk' ? 'sidewalk' : 'cycleway'
    notes.push(`${side} ${feature} is mapped as its own way`)
  }
  return notes
}
