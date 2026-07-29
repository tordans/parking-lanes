import {
  DEFAULT_WIDTHS_M,
  parseSlotId,
  type RoadSpaceScene,
  type RoadSpaceSlotKind,
  type SceneSlotRect,
} from '@osm-editor-kit/osm-lane-diagram'
import type { LaneSlot, Provenance, WayLaneModel } from '@osm-editor-kit/osm-lanes'
import type { SidepathPrefix, SidepathSide } from '@osm-editor-kit/osm-sidepath-tags'

export type MatrixRowId =
  | 'turn'
  | 'width'
  | 'surface'
  | 'smoothness'
  | 'change'
  | 'vehicle'
  | 'bicycle'
  | 'bus'

export type MatrixWritePath = 'serializeWayLanes' | 'nestSideTags' | 'none'

export type MatrixCell = {
  slotId: string
  display: string
  provenance: Provenance | 'untagged'
  editable: boolean
  writePath: MatrixWritePath
  /** Hint when not editable. */
  readOnlyReason?: 'edge_na' | 'auth' | 'unsupported' | 'pipe_positioned'
  /** Input placeholder when display is a default (e.g. untagged width). */
  inputPlaceholder?: string
}

export type MatrixColumn = {
  slotId: string
  label: string
  kind: RoadSpaceSlotKind
  isEdge: boolean
  edge?: { prefix: SidepathPrefix; side: SidepathSide }
  lane?: { direction: LaneSlot['direction']; index: number }
}

const ROW_LANE_FIELD: Record<
  MatrixRowId,
  keyof Pick<
    LaneSlot,
    | 'turn'
    | 'widthMeters'
    | 'surface'
    | 'smoothness'
    | 'change'
    | 'vehicleAccess'
    | 'bicycleAccess'
    | 'busAccess'
  >
> = {
  turn: 'turn',
  width: 'widthMeters',
  surface: 'surface',
  smoothness: 'smoothness',
  change: 'change',
  vehicle: 'vehicleAccess',
  bicycle: 'bicycleAccess',
  bus: 'busAccess',
}

const ROW_PROVENANCE: Record<MatrixRowId, keyof LaneSlot['provenance'] | 'widthMeters'> = {
  turn: 'turn',
  width: 'widthMeters',
  surface: 'surface',
  smoothness: 'smoothness',
  change: 'change',
  vehicle: 'vehicleAccess',
  bicycle: 'bicycleAccess',
  bus: 'busAccess',
}

/** Edge / on-carriageway cycle slots: width / surface / smoothness via nestSideTags. */
const NEST_EDITABLE_ROWS = new Set<MatrixRowId>(['width', 'surface', 'smoothness'])

const ON_CARRIAGEWAY_CYCLE = new Set([
  'lane',
  'share_busway',
  'shared_lane',
  'opposite_lane',
  'opposite_share_busway',
])

/** Synthetic indices from expandOnCarriagewayCycleSlots (`nextIndex = 10_000`). */
export const ON_CARRIAGEWAY_CYCLE_INDEX_BASE = 10_000

function isOnCarriagewayCycleValue(value: string | undefined): boolean {
  return value != null && ON_CARRIAGEWAY_CYCLE.has(value.toLowerCase())
}

/**
 * Side for synthetic on-carriageway cycle columns (`cycleway:*=lane` etc.).
 * Matches expandOnCarriagewayCycleSlots: left → backward, right → forward.
 * Returns undefined for `cycleway:lanes` pipe expansions (no side key) and for
 * real `parseWayLanes` bicycle slots (index < 10_000).
 */
export function onCarriagewayCycleSide(
  column: Pick<MatrixColumn, 'kind' | 'isEdge' | 'lane'>,
  tags: Record<string, string>,
): SidepathSide | undefined {
  if (column.isEdge || column.kind !== 'cycle' || !column.lane) return undefined
  if (column.lane.index < ON_CARRIAGEWAY_CYCLE_INDEX_BASE) return undefined

  const left =
    tags['cycleway:left'] ??
    tags['cycleway:both'] ??
    (tags.cycleway && tags.cycleway !== 'right' ? tags.cycleway : undefined)
  const right =
    tags['cycleway:right'] ??
    tags['cycleway:both'] ??
    (tags.cycleway && tags.cycleway !== 'left' ? tags.cycleway : undefined)

  if (column.lane.direction === 'backward' && isOnCarriagewayCycleValue(left)) return 'left'
  if (column.lane.direction === 'forward' && isOnCarriagewayCycleValue(right)) return 'right'
  return undefined
}

function columnFromRect(rect: SceneSlotRect, tags: Record<string, string>): MatrixColumn {
  const kind = rect.kind as RoadSpaceSlotKind
  const parsed = parseSlotId(rect.slotId)
  if (parsed?.kind === 'edge') {
    return {
      slotId: rect.slotId,
      label: `${parsed.ref.prefix}:${parsed.ref.side}`,
      kind,
      isEdge: true,
      edge: { prefix: parsed.ref.prefix, side: parsed.ref.side },
    }
  }
  if (parsed?.kind === 'lane') {
    const base: MatrixColumn = {
      slotId: rect.slotId,
      label: `${parsed.direction[0]!.toUpperCase()}${parsed.index + 1}`,
      kind,
      isEdge: false,
      lane: { direction: parsed.direction, index: parsed.index },
    }
    const cycleSide = onCarriagewayCycleSide(base, tags)
    if (cycleSide) {
      return {
        ...base,
        label: `cycleway:${cycleSide}`,
        edge: { prefix: 'cycleway', side: cycleSide },
      }
    }
    return base
  }
  return {
    slotId: rect.slotId,
    label: rect.label ?? kind,
    kind,
    isEdge: false,
  }
}

/**
 * Matrix columns follow the scene’s current-segment travel/sidepath slots
 * (excludes median island + sibling placeholder). Left→right by layout x.
 */
export function buildMatrixColumns(
  scene: RoadSpaceScene | null,
  tags: Record<string, string> = {},
): MatrixColumn[] {
  if (!scene) return []
  return scene.slotRects
    .filter((rect) => rect.role === 'current' && rect.kind !== 'median' && rect.label !== 'sibling')
    .slice()
    .sort((a, b) => a.x - b.x || a.slotId.localeCompare(b.slotId))
    .map((rect) => columnFromRect(rect, tags))
}

function laneSlotForColumn(model: WayLaneModel, column: MatrixColumn): LaneSlot | undefined {
  if (!column.lane) return undefined
  return model.slots.find(
    (s) => s.direction === column.lane!.direction && s.index === column.lane!.index,
  )
}

function edgeTagValue(
  tags: Record<string, string>,
  column: MatrixColumn,
  row: MatrixRowId,
): string | undefined {
  if (!column.edge) return undefined
  const { prefix, side } = column.edge
  if (row === 'width') {
    return tags[`${prefix}:${side}:width`] ?? tags[`${prefix}:both:width`]
  }
  if (row === 'surface') {
    return tags[`${prefix}:${side}:surface`] ?? tags[`${prefix}:both:surface`]
  }
  if (row === 'smoothness') {
    return tags[`${prefix}:${side}:smoothness`] ?? tags[`${prefix}:both:smoothness`]
  }
  return undefined
}

function defaultWidthDisplay(kind: RoadSpaceSlotKind): string {
  const w = DEFAULT_WIDTHS_M[kind]
  return Number.isInteger(w) ? String(w) : w.toFixed(1)
}

/** `cycleway:lanes` (+ directional) when present. */
function cyclewayLanesPipe(tags: Record<string, string>): string | undefined {
  return (
    tags['cycleway:lanes'] ??
    tags['cycleway:lanes:forward'] ??
    (tags.oneway === 'yes' ? tags['cycleway:lanes'] : undefined)
  )
}

function isCyclewayLanesCycleToken(token: string): boolean {
  const t = token.trim().toLowerCase()
  return t === 'lane' || t === 'share_busway' || t === 'shared_lane'
}

/**
 * Width token for a pipe-positioned on-carriageway cycle column.
 * Matches synthetic cycle columns (index ≥ 10_000, no side key) to `width:lanes`
 * by ordinal among cycle tokens in `cycleway:lanes`.
 */
function widthFromCyclewayLanesPipe(
  tags: Record<string, string>,
  column: MatrixColumn,
  columns: MatrixColumn[],
): string | undefined {
  if (column.kind !== 'cycle' || column.isEdge || column.edge) return undefined
  if (!column.lane || column.lane.index < ON_CARRIAGEWAY_CYCLE_INDEX_BASE) return undefined
  const pipe = cyclewayLanesPipe(tags)
  if (!pipe) return undefined

  const widthPipe = tags['width:lanes'] ?? tags['width:lanes:forward']
  if (!widthPipe) return undefined

  const tokens = pipe.split('|')
  const widths = widthPipe.split('|')
  const cyclePipeIndices: number[] = []
  for (let i = 0; i < tokens.length; i++) {
    if (isCyclewayLanesCycleToken(tokens[i]!)) cyclePipeIndices.push(i)
  }

  const pipeCycleColumns = columns.filter(
    (c) =>
      c.kind === 'cycle' &&
      !c.isEdge &&
      !c.edge &&
      c.lane != null &&
      c.lane.index >= ON_CARRIAGEWAY_CYCLE_INDEX_BASE,
  )
  const ordinal = pipeCycleColumns.findIndex((c) => c.slotId === column.slotId)
  if (ordinal < 0) return undefined
  const pipeIndex = cyclePipeIndices[ordinal]
  if (pipeIndex == null) return undefined
  const token = widths[pipeIndex]?.trim()
  return token && token !== '' ? token : undefined
}

function nestSideCell(
  row: MatrixRowId,
  column: MatrixColumn,
  tags: Record<string, string>,
  readOnly: boolean,
): MatrixCell {
  if (!NEST_EDITABLE_ROWS.has(row)) {
    return {
      slotId: column.slotId,
      display: '—',
      provenance: 'untagged',
      editable: false,
      writePath: 'none',
      readOnlyReason: column.isEdge ? 'edge_na' : 'unsupported',
    }
  }
  const value = edgeTagValue(tags, column, row)
  const hasValue = value != null && value !== ''
  if (row === 'width' && !hasValue) {
    const placeholder = defaultWidthDisplay(column.kind)
    return {
      slotId: column.slotId,
      display: placeholder,
      provenance: 'untagged',
      editable: !readOnly,
      writePath: 'nestSideTags',
      readOnlyReason: readOnly ? 'auth' : undefined,
      inputPlaceholder: placeholder,
    }
  }
  return {
    slotId: column.slotId,
    display: hasValue ? value! : '—',
    provenance: hasValue ? 'tagged' : 'untagged',
    editable: !readOnly,
    writePath: 'nestSideTags',
    readOnlyReason: readOnly ? 'auth' : undefined,
  }
}

export function getMatrixCell(
  row: MatrixRowId,
  column: MatrixColumn,
  model: WayLaneModel,
  tags: Record<string, string>,
  readOnly: boolean,
  columns: MatrixColumn[] = [],
): MatrixCell {
  // Sidepath edges and on-carriageway cycle columns share nestSideTags write paths.
  if (column.edge) {
    return nestSideCell(row, column, tags, readOnly)
  }

  const lane = laneSlotForColumn(model, column)
  if (!lane) {
    // Pipe-positioned cycleway:lanes columns — diagram-only; show tagged width when known.
    const isPipeCycle =
      column.kind === 'cycle' &&
      column.lane != null &&
      column.lane.index >= ON_CARRIAGEWAY_CYCLE_INDEX_BASE &&
      cyclewayLanesPipe(tags) != null

    if (isPipeCycle) {
      if (row === 'width') {
        const tagged = widthFromCyclewayLanesPipe(tags, column, columns)
        if (tagged) {
          return {
            slotId: column.slotId,
            display: tagged,
            provenance: 'tagged',
            editable: false,
            writePath: 'none',
            readOnlyReason: 'pipe_positioned',
          }
        }
        const placeholder = defaultWidthDisplay('cycle')
        return {
          slotId: column.slotId,
          display: placeholder,
          provenance: 'untagged',
          editable: false,
          writePath: 'none',
          readOnlyReason: 'pipe_positioned',
          inputPlaceholder: placeholder,
        }
      }
      return {
        slotId: column.slotId,
        display: '—',
        provenance: 'untagged',
        editable: false,
        writePath: 'none',
        readOnlyReason: 'pipe_positioned',
      }
    }

    return {
      slotId: column.slotId,
      display: '—',
      provenance: 'untagged',
      editable: false,
      writePath: 'none',
      readOnlyReason: 'unsupported',
    }
  }

  const field = ROW_LANE_FIELD[row]
  const raw = lane[field]
  const provKey = ROW_PROVENANCE[row]
  const hasValue = raw != null && raw !== ''

  if (row === 'width' && !hasValue) {
    const placeholder = defaultWidthDisplay(column.kind)
    return {
      slotId: column.slotId,
      display: placeholder,
      provenance: 'untagged',
      editable: !readOnly,
      writePath: 'serializeWayLanes',
      readOnlyReason: readOnly ? 'auth' : undefined,
      inputPlaceholder: placeholder,
    }
  }

  const display = !hasValue ? '—' : typeof raw === 'number' ? String(raw) : String(raw)
  const provenance: Provenance | 'untagged' = !hasValue
    ? 'untagged'
    : (lane.provenance[provKey as keyof LaneSlot['provenance']] ?? 'tagged')

  return {
    slotId: column.slotId,
    display,
    provenance,
    editable: !readOnly,
    writePath: 'serializeWayLanes',
    readOnlyReason: readOnly ? 'auth' : undefined,
  }
}

export function applyLaneFieldUpdate(
  slots: LaneSlot[],
  column: MatrixColumn,
  row: MatrixRowId,
  value: string,
): LaneSlot[] {
  if (!column.lane) return slots
  const field = ROW_LANE_FIELD[row]
  return slots.map((slot) => {
    if (slot.direction !== column.lane!.direction || slot.index !== column.lane!.index) {
      return slot
    }
    if (field === 'widthMeters') {
      const parsed = Number.parseFloat(value)
      return {
        ...slot,
        widthMeters: Number.isFinite(parsed) && value.trim() !== '' ? parsed : undefined,
        provenance: { ...slot.provenance, widthMeters: 'tagged' },
      }
    }
    return {
      ...slot,
      [field]: value.trim() === '' ? undefined : value.trim(),
      provenance: {
        ...slot.provenance,
        [ROW_PROVENANCE[row]]: 'tagged',
      },
    }
  })
}

export function edgePatchForRow(
  row: MatrixRowId,
  value: string,
): Record<string, string | undefined> | null {
  const trimmed = value.trim()
  const cleared = trimmed === '' ? undefined : trimmed
  if (row === 'width') return { width: cleared }
  if (row === 'surface') return { surface: cleared }
  if (row === 'smoothness') return { smoothness: cleared }
  return null
}

export const MATRIX_ROWS: Array<{ id: MatrixRowId; labelKey: string }> = [
  { id: 'turn', labelKey: 'lanes_matrix_row_turn' },
  { id: 'width', labelKey: 'lanes_matrix_row_width' },
  { id: 'surface', labelKey: 'lanes_matrix_row_surface' },
  { id: 'smoothness', labelKey: 'lanes_matrix_row_smoothness' },
  { id: 'change', labelKey: 'lanes_matrix_row_change' },
  { id: 'vehicle', labelKey: 'lanes_matrix_row_vehicle' },
  { id: 'bicycle', labelKey: 'lanes_matrix_row_bicycle' },
  { id: 'bus', labelKey: 'lanes_matrix_row_bus' },
]
