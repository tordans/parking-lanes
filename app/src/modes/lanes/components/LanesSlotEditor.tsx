import * as m from '@app/paraglide/messages'
import type { LaneSlot } from '@osm-editor-kit/osm-lanes'
import { useState } from 'react'
import { useDebouncedCommit } from '../../../components/tag-editor'
import { slotKey } from '../domain/display-order'

type Props = {
  slot: LaneSlot
  readOnly: boolean
  onCommitSlotUpdate: (updater: (slots: LaneSlot[]) => LaneSlot[]) => void
}

export function LanesSlotEditor({ slot, readOnly, onCommitSlotUpdate }: Props) {
  const [draftSlot, setDraftSlot] = useState(slot)
  const [trackedKey, setTrackedKey] = useState(() => slotKey(slot))

  const { commit } = useDebouncedCommit((nextSlot: LaneSlot) => {
    onCommitSlotUpdate((slots) =>
      slots.map((current) => (slotKey(current) === slotKey(nextSlot) ? nextSlot : current)),
    )
  })

  if (slotKey(slot) !== trackedKey) {
    setTrackedKey(slotKey(slot))
    setDraftSlot(slot)
  }

  function updateSlot(field: keyof LaneSlot, value: string) {
    if (readOnly) return
    const next = { ...draftSlot, [field]: value || undefined }
    setDraftSlot(next)
    commit(next)
  }

  function updateWidthMeters(value: string) {
    if (readOnly) return
    const nextWidth = Number.parseFloat(value)
    if (!Number.isFinite(nextWidth)) return
    const next = { ...draftSlot, widthMeters: nextWidth }
    setDraftSlot(next)
    commit(next)
  }

  return (
    <section className="flex flex-col gap-3 rounded-md border border-zinc-200 bg-zinc-50/80 p-3">
      <h3 className="text-sm font-semibold text-zinc-900">
        {m.panel_lanes()} {draftSlot.index + 1} ({draftSlot.direction})
      </h3>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">{m.panel_turn()}</span>
        <input
          type="text"
          disabled={readOnly}
          value={draftSlot.turn ?? ''}
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
          value={draftSlot.vehicleAccess ?? ''}
          className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm disabled:bg-zinc-50"
          onChange={(event) => updateSlot('vehicleAccess', event.target.value)}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">{m.panel_bicycle_access()}</span>
        <input
          type="text"
          disabled={readOnly}
          value={draftSlot.bicycleAccess ?? ''}
          className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm disabled:bg-zinc-50"
          onChange={(event) => updateSlot('bicycleAccess', event.target.value)}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">{m.panel_bus_access()}</span>
        <input
          type="text"
          disabled={readOnly}
          value={draftSlot.busAccess ?? ''}
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
          value={draftSlot.widthMeters ?? ''}
          className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm disabled:bg-zinc-50"
          onChange={(event) => updateWidthMeters(event.target.value)}
        />
      </label>
    </section>
  )
}
