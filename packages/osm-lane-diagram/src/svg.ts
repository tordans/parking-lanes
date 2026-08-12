import type {
  RoadSpaceScene,
  RoadSpaceSlotKind,
  ScenePolyline,
  SceneRibbon,
  SceneSlotRect,
  SceneSlotRectKind,
} from './types'

const COLORS: Record<RoadSpaceSlotKind, string> = {
  motor: '#d1d5db',
  bus: '#fde68a',
  cycle: '#86efac',
  both_ways: '#fda4af',
  sidewalk: '#e7e5e4',
  shared_path: '#a7f3d0',
}

const COLOR_PLACEMENT_GUIDE = '#8b5cf6'
const COLOR_PLATE = '#e4e4e7'
const COLOR_MEDIAN = '#f3f4f6'
const COLOR_KERB = '#1f2937'
const COLOR_OUTER = '#9ca3af'
const COLOR_SEPARATOR = '#6b7280'
const COLOR_CENTRELINE = '#374151'
const COLOR_BOUNDARY = '#d1d5db'
const COLOR_HIGHLIGHT = '#2563eb'
const COLOR_DIM = '#9ca3af'

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function pointsAttr(points: Array<{ x: number; y: number }>): string {
  return points.map((p) => `${round2(p.x)},${round2(p.y)}`).join(' ')
}

function fillForKind(kind: SceneSlotRectKind): string {
  if (kind === 'median') return COLOR_MEDIAN
  return COLORS[kind]
}

function ribbonFill(ribbon: SceneRibbon, highlighted: boolean): string {
  if (ribbon.label === 'sibling') return COLOR_DIM
  if (highlighted) return COLOR_HIGHLIGHT
  if (ribbon.dimmed) return COLOR_DIM
  return fillForKind(ribbon.kind)
}

function slotFill(rect: SceneSlotRect, highlighted: boolean, ribbonsCoverTravel: boolean): string {
  if (rect.kind === 'median') return 'none'
  if (rect.label === 'sibling') return COLOR_DIM
  if (rect.label === 'step_fill') return ribbonsCoverTravel ? 'none' : fillForKind(rect.kind)
  if (ribbonsCoverTravel) return 'none'
  if (highlighted) return COLOR_HIGHLIGHT
  if (rect.dimmed) return COLOR_DIM
  return fillForKind(rect.kind)
}

function polylineStroke(line: ScenePolyline): string {
  if (line.kind === 'kerb') return COLOR_KERB
  if (line.kind === 'outer_edge') return COLOR_OUTER
  if (line.kind === 'placement_guide' || line.kind === 'sibling_placement_guide') {
    return COLOR_PLACEMENT_GUIDE
  }
  if (line.kind === 'centreline') return COLOR_CENTRELINE
  if (line.kind === 'segment_boundary') return COLOR_BOUNDARY
  return COLOR_SEPARATOR
}

function polylineStrokeWidth(line: ScenePolyline): string {
  if (line.kind === 'placement_guide') return '4'
  if (line.kind === 'sibling_placement_guide') return '2.5'
  if (line.kind === 'segment_boundary') return '1'
  if (line.kind === 'outer_edge') return '1'
  return '1.5'
}

function isRibbonHighlighted(ribbon: SceneRibbon, highlighted: string | null): boolean {
  if (highlighted == null) return false
  if (ribbon.slotId === highlighted) return true
  return ribbon.bandSlices.some((s) => s.slotId === highlighted)
}

/**
 * Deterministic SVG serializer — fixed attribute order, rounded coords, no random ids.
 */
export function sceneToSvg(
  scene: RoadSpaceScene,
  options?: { highlightedSlotId?: string | null },
): string {
  const highlighted = options?.highlightedSlotId ?? null
  const ribbonsCoverTravel = scene.ribbons.length > 0
  const parts: string[] = []

  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${round2(scene.widthPx)}" height="${round2(scene.heightPx)}" viewBox="0 0 ${round2(scene.widthPx)} ${round2(scene.heightPx)}">`,
  )

  const plates = scene.carriagewayPlates ?? (scene.carriagewayPlate ? [scene.carriagewayPlate] : [])
  for (const plate of plates) {
    parts.push(
      `<polygon data-plate="carriageway" points="${pointsAttr(plate.points)}" fill="${COLOR_PLATE}" opacity="0.55"/>`,
    )
  }

  for (const junction of scene.junctions ?? []) {
    const y = round2(junction.y)
    const h = round2(junction.height)
    const w = round2(scene.widthPx)
    parts.push(
      `<rect data-junction="1" x="0" y="${y}" width="${w}" height="${h}" fill="${COLOR_PLATE}" opacity="0.6"/>`,
      `<line data-junction-edge="top" x1="0" y1="${y}" x2="${w}" y2="${y}" stroke="${COLOR_BOUNDARY}" stroke-width="1" stroke-dasharray="4 3"/>`,
      `<line data-junction-edge="bottom" x1="0" y1="${round2(y + h)}" x2="${w}" y2="${round2(y + h)}" stroke="${COLOR_BOUNDARY}" stroke-width="1" stroke-dasharray="4 3"/>`,
      `<text data-junction-label="1" x="${round2(w / 2)}" y="${round2(y + h / 2)}" text-anchor="middle" dominant-baseline="middle" font-size="9" fill="#52525b" font-family="ui-sans-serif, system-ui, sans-serif">junction</text>`,
    )
  }

  for (const band of scene.bands) {
    const opacity = band.dimmed ? '0.55' : '1'
    parts.push(
      `<rect data-band="${band.role}" data-way="${band.wayId}" x="0" y="${round2(band.y)}" width="${round2(scene.widthPx)}" height="${round2(band.height)}" fill="none" opacity="${opacity}"/>`,
    )
  }

  for (const line of scene.polylines) {
    if (line.kind !== 'segment_boundary') continue
    parts.push(
      `<polyline data-line="${escapeXml(line.id)}" data-kind="${line.kind}" fill="none" stroke="${polylineStroke(line)}" stroke-width="${polylineStrokeWidth(line)}" points="${pointsAttr(line.points)}"/>`,
    )
  }

  for (const ribbon of scene.ribbons) {
    const isHi = isRibbonHighlighted(ribbon, highlighted)
    const fill = ribbonFill(ribbon, isHi)
    const opacity = ribbon.dimmed && !isHi ? '0.45' : ribbon.label === 'sibling' ? '0.7' : '1'
    parts.push(
      `<polygon data-ribbon="${escapeXml(ribbon.id)}" data-zone="${ribbon.zone}" points="${pointsAttr(ribbon.points)}" fill="${fill}" stroke="${isHi ? COLOR_HIGHLIGHT : 'none'}" stroke-width="${isHi ? '1' : '0'}" opacity="${opacity}"/>`,
    )
  }

  for (const rect of scene.slotRects) {
    const isHi = highlighted != null && rect.slotId === highlighted
    const fill = slotFill(rect, isHi, ribbonsCoverTravel)
    const stroke =
      rect.widthProvenance === 'default' ? COLOR_SEPARATOR : isHi ? COLOR_HIGHLIGHT : 'none'
    const strokeWidth = rect.widthProvenance === 'default' || isHi ? '1' : '0'
    const opacity = rect.dimmed && !isHi ? '0.45' : '1'
    if (
      fill === 'none' &&
      stroke === 'none' &&
      rect.label !== 'median' &&
      rect.label !== 'sibling'
    ) {
      continue
    }
    if (rect.points && rect.points.length >= 3) {
      parts.push(
        `<polygon data-slot="${escapeXml(rect.slotId)}" data-zone="${rect.zone}" points="${pointsAttr(rect.points)}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" opacity="${opacity}"/>`,
      )
    } else {
      parts.push(
        `<rect data-slot="${escapeXml(rect.slotId)}" data-zone="${rect.zone}" x="${round2(rect.x)}" y="${round2(rect.y)}" width="${round2(rect.width)}" height="${round2(rect.height)}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" opacity="${opacity}"/>`,
      )
    }
  }

  for (const line of scene.polylines) {
    if (
      line.kind === 'segment_boundary' ||
      line.kind === 'placement_guide' ||
      line.kind === 'sibling_placement_guide'
    ) {
      continue
    }
    const dash = line.style === 'dashed' ? ' stroke-dasharray="4 3"' : ''
    const roundCaps =
      line.kind === 'kerb' || line.kind === 'outer_edge'
        ? ' stroke-linecap="round" stroke-linejoin="round"'
        : ''
    parts.push(
      `<polyline data-line="${escapeXml(line.id)}" data-kind="${line.kind}" fill="none" stroke="${polylineStroke(line)}" stroke-width="${polylineStrokeWidth(line)}"${dash}${roundCaps} points="${pointsAttr(line.points)}"/>`,
    )
  }

  // Placement centreline on top with way-direction arrow (OSM forward = up).
  for (const line of scene.polylines) {
    if (line.kind !== 'placement_guide') continue
    const x = line.points[0]?.x ?? scene.centrelineX ?? 0
    const ys = line.points.map((p) => p.y)
    const y0 = Math.min(...ys)
    const y1 = Math.max(...ys)
    const midY = (y0 + y1) / 2
    const head = 7
    parts.push(
      `<g data-placement-guide="1" opacity="0.55"><polyline data-line="${escapeXml(line.id)}" data-kind="${line.kind}" fill="none" stroke="${polylineStroke(line)}" stroke-width="4" points="${pointsAttr(line.points)}"/><polyline fill="none" stroke="${polylineStroke(line)}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" points="${round2(x - head)},${round2(midY + head * 0.2)} ${round2(x)},${round2(midY - head)} ${round2(x + head)},${round2(midY + head * 0.2)}"/></g>`,
    )
  }

  // Secondary violet guide over the opposite dual carriageway (narrower / dimmer).
  for (const line of scene.polylines) {
    if (line.kind !== 'sibling_placement_guide') continue
    const xs = line.points.map((p) => p.x)
    const ys = line.points.map((p) => p.y)
    const x = xs.length > 0 ? xs.reduce((a, b) => a + b, 0) / xs.length : 0
    const y0 = Math.min(...ys)
    const y1 = Math.max(...ys)
    const midY = (y0 + y1) / 2
    const head = 5
    const arrow =
      line.forward === 'down'
        ? `${round2(x - head)},${round2(midY - head * 0.2)} ${round2(x)},${round2(midY + head)} ${round2(x + head)},${round2(midY - head * 0.2)}`
        : line.forward === 'up'
          ? `${round2(x - head)},${round2(midY + head * 0.2)} ${round2(x)},${round2(midY - head)} ${round2(x + head)},${round2(midY + head * 0.2)}`
          : null
    const arrowMarkup = arrow
      ? `<polyline fill="none" stroke="${polylineStroke(line)}" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" points="${arrow}"/>`
      : ''
    const label = line.forward === 'down' ? 'way ↓' : line.forward === 'up' ? 'way ↑' : null
    const labelMarkup = label
      ? `<text x="${round2(x + 6)}" y="${round2(y0 + 24)}" font-size="8" fill="${COLOR_PLACEMENT_GUIDE}" font-family="ui-sans-serif, system-ui, sans-serif" font-weight="600" opacity="0.7">${label}</text>`
      : ''
    parts.push(
      `<g data-sibling-placement-guide="1" opacity="0.4"><polyline data-line="${escapeXml(line.id)}" data-kind="${line.kind}" fill="none" stroke="${polylineStroke(line)}" stroke-width="2.5" stroke-linecap="round" points="${pointsAttr(line.points)}"/>${arrowMarkup}${labelMarkup}</g>`,
    )
  }

  parts.push('</svg>')
  return parts.join('')
}
