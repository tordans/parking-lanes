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
  if (line.kind === 'placement_guide') return COLOR_PLACEMENT_GUIDE
  if (line.kind === 'centreline') return COLOR_CENTRELINE
  if (line.kind === 'segment_boundary') return COLOR_BOUNDARY
  return COLOR_SEPARATOR
}

function polylineStrokeWidth(line: ScenePolyline): string {
  if (line.kind === 'placement_guide') return '4'
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

  if (scene.carriagewayPlate) {
    parts.push(
      `<polygon data-plate="carriageway" points="${pointsAttr(scene.carriagewayPlate.points)}" fill="${COLOR_PLATE}" opacity="0.55"/>`,
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
    if (line.kind === 'segment_boundary' || line.kind === 'placement_guide') continue
    const dash = line.style === 'dashed' ? ' stroke-dasharray="4 3"' : ''
    parts.push(
      `<polyline data-line="${escapeXml(line.id)}" data-kind="${line.kind}" fill="none" stroke="${polylineStroke(line)}" stroke-width="${polylineStrokeWidth(line)}"${dash} points="${pointsAttr(line.points)}"/>`,
    )
  }

  // Placement centreline on top with way-direction arrow (OSM forward = down).
  for (const line of scene.polylines) {
    if (line.kind !== 'placement_guide') continue
    const x = line.points[0]?.x ?? scene.centrelineX ?? 0
    const ys = line.points.map((p) => p.y)
    const y0 = Math.min(...ys)
    const y1 = Math.max(...ys)
    const midY = (y0 + y1) / 2
    const head = 7
    parts.push(
      `<g data-placement-guide="1" opacity="0.55"><polyline data-line="${escapeXml(line.id)}" data-kind="${line.kind}" fill="none" stroke="${polylineStroke(line)}" stroke-width="4" points="${pointsAttr(line.points)}"/><polyline fill="none" stroke="${polylineStroke(line)}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" points="${round2(x - head)},${round2(midY - head * 0.2)} ${round2(x)},${round2(midY + head)} ${round2(x + head)},${round2(midY - head * 0.2)}"/></g>`,
    )
  }

  parts.push('</svg>')
  return parts.join('')
}
