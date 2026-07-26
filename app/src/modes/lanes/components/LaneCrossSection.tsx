import type { LaneDirection, LaneSlot } from '@osm-editor-kit/osm-lanes'
import clsx from 'clsx'
import { Minus, Plus } from 'lucide-react'
import { crossSectionDisplaySlots, slotKey } from '../domain/display-order'
import { LaneSlotChip } from './LaneSlotChip'

type Props = {
  slots: LaneSlot[]
  wayId: number
  selectedSlotKey: string | null
  highlighted?: boolean
  center?: boolean
  label: string
  onSelectSlot: (wayId: number, slot: LaneSlot) => void
  onSelectSegment?: () => void
  readOnly?: boolean
  addDirections?: LaneDirection[]
  onAddLane?: (direction: LaneDirection) => void
  onRemoveLane?: () => void
  canRemoveLane?: boolean
}

function isSlotDimmed(slot: LaneSlot): boolean {
  return (
    slot.provenance.count !== 'tagged' &&
    slot.provenance.turn !== 'tagged' &&
    slot.provenance.kind !== 'tagged'
  )
}

function directionLabel(direction: LaneDirection): string {
  if (direction === 'forward') return 'fwd'
  if (direction === 'backward') return 'bwd'
  return 'both'
}

export function LaneCrossSection({
  slots,
  wayId,
  selectedSlotKey,
  highlighted,
  center,
  label,
  onSelectSlot,
  onSelectSegment,
  readOnly,
  addDirections,
  onAddLane,
  onRemoveLane,
  canRemoveLane,
}: Props) {
  const displaySlots = crossSectionDisplaySlots(slots)
  const showEditControls = center && !readOnly && addDirections && addDirections.length > 0

  return (
    <div
      className={clsx(
        'flex min-w-0 flex-1 flex-col gap-2 rounded-lg border p-2 transition-colors',
        center
          ? 'border-blue-400 bg-blue-50/70 shadow-sm ring-1 ring-blue-200'
          : highlighted
            ? 'border-zinc-200 bg-zinc-50/80 opacity-90'
            : 'border-transparent opacity-75',
      )}
    >
      <button
        type="button"
        onClick={onSelectSegment}
        className={clsx(
          'truncate text-left text-xs font-medium',
          center ? 'text-blue-800' : 'text-zinc-600 hover:text-zinc-900',
        )}
      >
        {center ? '★ ' : ''}
        {label}
      </button>
      <div className="flex min-h-0 flex-1 items-stretch justify-center gap-1">
        {displaySlots.length === 0 ? (
          <div className="flex flex-1 items-center justify-center rounded-md border border-dashed border-zinc-200 text-xs text-zinc-400">
            No lanes
          </div>
        ) : (
          displaySlots.map((slot) => (
            <div key={slotKey(slot)} className="flex min-w-0 flex-1">
              <LaneSlotChip
                kind={slot.kind}
                turn={slot.turn}
                widthMeters={slot.widthMeters}
                dimmed={isSlotDimmed(slot)}
                selected={selectedSlotKey === slotKey(slot)}
                onClick={() => onSelectSlot(wayId, slot)}
              />
            </div>
          ))
        )}
      </div>

      {showEditControls ? (
        <div className="flex flex-wrap items-center gap-1.5 border-t border-blue-200/80 pt-2">
          {addDirections!.map((direction) => (
            <button
              key={direction}
              type="button"
              onClick={() => onAddLane?.(direction)}
              className="inline-flex items-center gap-1 rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-700 hover:bg-zinc-50"
            >
              <Plus className="size-3" aria-hidden />
              {directionLabel(direction)}
            </button>
          ))}
          <button
            type="button"
            disabled={!canRemoveLane}
            onClick={onRemoveLane}
            className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-white px-2 py-1 text-xs text-red-700 enabled:hover:bg-red-50 disabled:opacity-40"
          >
            <Minus className="size-3" aria-hidden />
            Remove
          </button>
        </div>
      ) : null}
    </div>
  )
}
