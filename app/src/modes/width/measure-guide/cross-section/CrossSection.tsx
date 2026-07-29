import {
  crossSectionLayout,
  FONT_SIZE,
  KERB_BODY_PX,
  SUM_LABEL_OFFSET,
  type LayoutBand,
  type LayoutDimension,
  type LayoutKerb,
} from './layout'
import type { BandKind, CrossSectionDensity, CrossSectionSpec } from './types'

/** Tailwind zinc + existing width/parking accents (teal tagged-width, orange parking). */
export const BAND_STYLE: Record<BandKind, { fill: string }> = {
  motor: { fill: '#a1a1aa' }, // zinc-400
  parking: { fill: '#fdba74' }, // orange-300 ↔ parking accent
  cycle: { fill: '#5eead4' }, // teal-300 ↔ width tagged teal
  foot: { fill: '#d4d4d8' }, // zinc-300
  buffer: { fill: '#fde68a' }, // amber-200
  verge: { fill: '#bbf7d0' }, // green-200
  paint: { fill: '#27272a' }, // zinc-800
  gutter: { fill: '#e4e4e7' }, // zinc-200
  outside: { fill: '#d4d4d8' }, // zinc-300 (further desaturated via opacity)
}

/** Stone kerb body — visually distinct from dark paint markings. */
const KERB_FILL = '#78716c' // stone-500
const KERB_FACE = '#44403c' // stone-700
/** Dimension arrows + OSM key labels (separate from black band chrome). */
const DIM_INK = '#5b21b6' // violet-800

type Props = {
  spec: CrossSectionSpec
  density?: CrossSectionDensity
  /** Accessible name; also used as SVG `<title>`. */
  title: string
  /** Optional override; defaults to `title`. */
  ariaLabel?: string
  className?: string
}

function BandRect({ band, patternId }: { band: LayoutBand; patternId: string }) {
  const style = BAND_STYLE[band.kind]
  const opacity = band.desaturated ? 0.45 : 1

  // Paint stays strictly inside its metre band so clear-width ticks on the
  // band edge are the **inner** face of the marking (no centred stroke bleed).
  if (band.kind === 'paint') {
    return (
      <rect
        x={band.x}
        y={band.y}
        width={Math.max(band.width, 0.5)}
        height={band.height}
        fill={style.fill}
        opacity={opacity}
      />
    )
  }

  return (
    <g opacity={opacity}>
      <rect
        x={band.x}
        y={band.y}
        width={Math.max(band.width, 0.5)}
        height={band.height}
        fill={style.fill}
      />
      {band.hatch ? (
        <rect
          x={band.x}
          y={band.y}
          width={Math.max(band.width, 0.5)}
          height={band.height}
          fill={`url(#${patternId})`}
        />
      ) : null}
      {band.label || band.flowArrow ? (
        <g fill="#18181b" fontSize={FONT_SIZE - 2} opacity={0.85} textAnchor="middle">
          {band.label ? (
            <text
              x={band.x + band.width / 2}
              y={band.y + band.height / 2 - (band.flowArrow ? 7 : 0)}
              dominantBaseline="middle"
            >
              {band.label}
            </text>
          ) : null}
          {band.flowArrow ? (
            <text
              x={band.x + band.width / 2}
              y={band.y + band.height / 2 + (band.label ? 8 : 0)}
              dominantBaseline="middle"
              fontSize={FONT_SIZE + 2}
              fontWeight={600}
              aria-hidden="true"
            >
              ↑
            </text>
          ) : null}
        </g>
      ) : null}
    </g>
  )
}

/**
 * Kerb as a physical barrier: solid body entirely **outside** the carriageway,
 * thin face line on the measure edge. Distinct from flat paint rectangles.
 */
function KerbBarrier({
  kerb,
  bandY,
  bandHeight,
}: {
  kerb: LayoutKerb
  bandY: number
  bandHeight: number
}) {
  const bodyX = kerb.body === 'left' ? kerb.x - KERB_BODY_PX : kerb.x
  const y = bandY - 3
  const h = bandHeight + 6

  return (
    <g>
      <rect x={bodyX} y={y} width={KERB_BODY_PX} height={h} fill={KERB_FILL} />
      {/* Face = carriageway edge; width=* / clear ticks attach here. */}
      <line
        x1={kerb.x}
        y1={y}
        x2={kerb.x}
        y2={y + h}
        stroke={KERB_FACE}
        strokeWidth={1.75}
        strokeLinecap="square"
      />
      {/* Small top lip suggesting a step / raised kerb. */}
      <rect x={bodyX} y={y - 2} width={KERB_BODY_PX} height={2.5} fill={KERB_FACE} />
    </g>
  )
}

function DimensionArrow({
  dim,
  bandY,
  bandHeight,
}: {
  dim: LayoutDimension
  bandY: number
  bandHeight: number
}) {
  const midX = (dim.x1 + dim.x2) / 2
  const labelY = dim.side === 'above' ? dim.y - 6 : dim.y + 6
  const sumY = dim.side === 'above' ? labelY - SUM_LABEL_OFFSET : labelY + SUM_LABEL_OFFSET
  const opacity = dim.struck ? 0.55 : 1
  // Extension lines meet the band face (top for above dims, bottom for below).
  const bandEdgeY = dim.side === 'above' ? bandY : bandY + bandHeight

  return (
    <g fill={DIM_INK} stroke={DIM_INK}>
      {dim.segments.map((seg, i) => (
        <g key={i} opacity={opacity}>
          <line x1={seg.x1} y1={dim.y} x2={seg.x2} y2={dim.y} strokeWidth={1.25} />
          {/* Left / right from–to: tick at the arrow + extension to the graphic. */}
          <line x1={seg.x1} y1={dim.y} x2={seg.x1} y2={bandEdgeY} strokeWidth={1.25} />
          <line x1={seg.x2} y1={dim.y} x2={seg.x2} y2={bandEdgeY} strokeWidth={1.25} />
        </g>
      ))}
      {dim.struck ? (
        <line
          x1={dim.x1 - 2}
          y1={dim.y + 6}
          x2={dim.x2 + 2}
          y2={dim.y - 6}
          strokeWidth={1.5}
          opacity={0.7}
        />
      ) : null}
      <text
        x={midX}
        y={labelY}
        textAnchor="middle"
        dominantBaseline="middle"
        stroke="none"
        fontSize={FONT_SIZE}
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        opacity={dim.struck ? 0.7 : 1}
      >
        {dim.labelText}
      </text>
      {dim.showSum && dim.sumText ? (
        <text
          x={midX}
          y={sumY}
          textAnchor="middle"
          dominantBaseline="middle"
          stroke="none"
          fontSize={FONT_SIZE - 2}
          fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          opacity={0.75}
        >
          {dim.sumText}
        </text>
      ) : null}
    </g>
  )
}

export function CrossSection({ spec, density = 'audit', title, ariaLabel, className }: Props) {
  const layout = crossSectionLayout(spec, density)
  const patternId = `hatch-${spec.id}`
  const label = ariaLabel ?? title

  return (
    <svg
      role="img"
      aria-label={label}
      viewBox={`0 0 ${layout.viewBox.width} ${layout.viewBox.height}`}
      width="100%"
      className={className}
      style={{
        color: '#18181b',
        display: 'block',
        // Intrinsic scale: 1 viewBox unit = 1 CSS px when it fits; shrink only when
        // wider than the container so metres stay comparable across diagrams.
        maxWidth: layout.viewBox.width,
      }}
    >
      <title>{title}</title>
      <defs>
        <pattern
          id={patternId}
          patternUnits="userSpaceOnUse"
          width="6"
          height="6"
          patternTransform="rotate(45)"
        >
          <line x1="0" y1="0" x2="0" y2="6" stroke="#78716c" strokeWidth="2" />
        </pattern>
      </defs>

      {layout.bands.map((band) => (
        <BandRect key={band.index} band={band} patternId={patternId} />
      ))}

      {/* Carriageway outline — inset so it does not thicken kerb/paint faces. */}
      <rect
        x={(layout.bands[0]?.x ?? 0) + 0.5}
        y={layout.bandY + 0.5}
        width={Math.max(layout.bands.reduce((w, b) => w + b.width, 0) - 1, 0)}
        height={layout.bandHeight - 1}
        fill="none"
        stroke="currentColor"
        strokeWidth={1}
        opacity={0.25}
      />

      {layout.kerbs.map((kerb, i) => (
        <KerbBarrier
          key={`kerb-${i}`}
          kerb={kerb}
          bandY={layout.bandY}
          bandHeight={layout.bandHeight}
        />
      ))}

      {layout.dimensions.map((dim, i) => (
        <DimensionArrow
          key={`${dim.key}-${dim.from}-${dim.to}-${i}`}
          dim={dim}
          bandY={layout.bandY}
          bandHeight={layout.bandHeight}
        />
      ))}
    </svg>
  )
}
