import * as m from '@app/paraglide/messages'
import type { LaneSlot } from '@osm-editor-kit/osm-lanes'
import { slotKey } from '../domain/display-order'

type Props = {
  slot: LaneSlot
  readOnly: boolean
  onCommitSlotUpdate: (updater: (slots: LaneSlot[]) => LaneSlot[]) => void
}

export function LanesSlotEditor({ slot, readOnly, onCommitSlotUpdate }: Props) {
  function updateSlot(field: keyof LaneSlot, value: string) {
    if (readOnly) return
    onCommitSlotUpdate((slots) =>
      slots.map((current) => {
        if (current.direction !== slot.direction || current.index !== slot.index) return current
        return { ...current, [field]: value || undefined }
      }),
    )
  }

  return (
    <section className="flex flex-col gap-3 rounded-md border border-zinc-200 bg-zinc-50/80 p-3">
      <h3 className="text-sm font-semibold text-zinc-900">
        {m.panel_lanes()} {slot.index + 1} ({slot.direction})
      </h3>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">{m.panel_turn()}</span>
        <input
          type="text"
          disabled={readOnly}
          value={slot.turn ?? ''}
          placeholder="e.g. left|through|right"
          className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm disabled:bg-zinc-50"
          onChange={(event) => updateSlot('turn', event.target.value)}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">{m.panel_vehicle_access()}</span>
        <input
          type="text"
          disabled={readOnly}
          value={slot.vehicleAccess ?? ''}
          className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm disabled:bg-zinc-50"
          onChange={(event) => updateSlot('vehicleAccess', event.target.value)}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">{m.panel_bicycle_access()}</span>
        <input
          type="text"
          disabled={readOnly}
          value={slot.bicycleAccess ?? ''}
          className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm disabled:bg-zinc-50"
          onChange={(event) => updateSlot('bicycleAccess', event.target.value)}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">{m.panel_bus_access()}</span>
        <input
          type="text"
          disabled={readOnly}
          value={slot.busAccess ?? ''}
          className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm disabled:bg-zinc-50"
          onChange={(event) => updateSlot('busAccess', event.target.value)}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">{m.panel_width_m()}</span>
        <input
          type="number"
          min={0}
          step={0.1}
          disabled={readOnly}
          value={slot.widthMeters ?? ''}
          className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm disabled:bg-zinc-50"
          onChange={(event) => {
            const next = Number.parseFloat(event.target.value)
            if (!Number.isFinite(next)) return
            onCommitSlotUpdate((slots) =>
              slots.map((current) => {
                if (slotKey(current) !== slotKey(slot)) return current
                return { ...current, widthMeters: next }
              }),
            )
          }}
        />
      </label>
    </section>
  )
}
