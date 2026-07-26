import type { LaneSlot } from '@osm-editor-kit/osm-lanes'
import { parseWayLanes } from '@osm-editor-kit/osm-lanes'
import { Minus, Plus } from 'lucide-react'
import { AuthState, useAuthState } from '../../shell/app-store'
import {
  MapFeatureLoadEmptyState,
  MapFeaturePromptEmptyState,
} from '../../shell/controls/MapFeatureEmptyState'
import { ModePanelIntro } from '../../shell/controls/ModePanelIntro'
import { useSelectedOsmRef } from '../../shell/map/feature-selection'
import { useMapViewport } from '../../shell/map/map-viewport'
import { LoginCallout } from '../parking/controls/LoginCallout'
import { useOsmAuth } from '../parking/map/use-osm-auth'
import { slotKey } from './domain/display-order'
import { viewMinZoom } from './map/constants'
import { useLanesMapActions, useSelectedLaneSlot } from './map/lanes-map-store'
import { useLanesOsmQuery } from './map/lanes-osm-query'
import { useLanesModeHandlers } from './use-lanes-mode-handlers'

function segmentSummary(tags: Record<string, string>): string {
  const parts: string[] = []
  if (tags.lanes) parts.push(`${tags.lanes} lanes`)
  if (tags['lanes:forward']) parts.push(`${tags['lanes:forward']} fwd`)
  if (tags['lanes:backward']) parts.push(`${tags['lanes:backward']} bwd`)
  return parts.length > 0 ? parts.join(' · ') : 'No lane count'
}

function findSlot(slots: LaneSlot[], ref: { direction: LaneSlot['direction']; index: number }) {
  return slots.find((slot) => slot.direction === ref.direction && slot.index === ref.index)
}

function directionLabel(direction: LaneSlot['direction']): string {
  if (direction === 'forward') return 'forward'
  if (direction === 'backward') return 'backward'
  return 'both ways'
}

export function LanesModePanel() {
  const selectedOsmRef = useSelectedOsmRef()
  const selectedSlot = useSelectedLaneSlot()
  const { setViewMode } = useLanesMapActions()
  const { commitSlotUpdate, addLane, removeLane, editableLaneDirections } = useLanesModeHandlers()
  const mapViewport = useMapViewport()
  const authState = useAuthState()
  const { login } = useOsmAuth()
  const { data: graph, isFetching } = useLanesOsmQuery({ select: (data) => data.graph })

  if (!selectedOsmRef || selectedOsmRef.type !== 'way') {
    return <MapFeaturePromptEmptyState message="Click a road on the map to edit lanes." />
  }

  const way = graph?.ways[selectedOsmRef.id] ?? null
  if (!way) {
    return (
      <MapFeatureLoadEmptyState
        zoom={mapViewport.zoom}
        minZoom={viewMinZoom}
        isFetching={isFetching}
        featureLabel={`way/${selectedOsmRef.id}`}
      />
    )
  }

  const model = parseWayLanes(way.tags)
  const activeSlot = selectedSlot
    ? findSlot(model.slots, { direction: selectedSlot.direction, index: selectedSlot.index })
    : undefined
  const readOnly = authState !== AuthState.success
  const addDirections = editableLaneDirections(model)

  function updateSlot(field: keyof LaneSlot, value: string) {
    if (!activeSlot || readOnly) return
    commitSlotUpdate(way, (slots) =>
      slots.map((slot) => {
        if (slot.direction !== activeSlot.direction || slot.index !== activeSlot.index) return slot
        return { ...slot, [field]: value || undefined }
      }),
    )
  }

  return (
    <div className="flex min-w-[250px] flex-col gap-4 text-zinc-900">
      <ModePanelIntro
        wayId={way.id}
        highway={way.tags.highway}
        className="flex items-center gap-2"
      />
      <div className="-mt-2 text-sm text-zinc-700">
        {way.tags.name ? <div className="font-medium text-zinc-900">{way.tags.name}</div> : null}
        {way.tags.ref ? <div className="text-zinc-500">{way.tags.ref}</div> : null}
        <div className="text-xs text-zinc-500">{segmentSummary(way.tags)}</div>
      </div>

      {readOnly ? <LoginCallout onLogin={() => void login()} /> : null}

      {model.warnings.length > 0 ? (
        <section className="flex flex-col gap-1.5" role="alert">
          <h3 className="text-sm font-semibold text-zinc-900">Warnings</h3>
          <ul className="m-0 flex list-none flex-col gap-1 p-0">
            {model.warnings.map((warning) => (
              <li
                key={warning.code}
                className={
                  warning.severity === 'error'
                    ? 'rounded-md border border-red-300 bg-red-50 px-2 py-1.5 text-xs font-medium text-red-900'
                    : 'rounded-md border border-amber-300 bg-amber-50 px-2 py-1.5 text-xs text-amber-900'
                }
              >
                {warning.message}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {!readOnly ? (
        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-zinc-900">Lanes</h3>
          <div className="flex flex-wrap gap-1.5">
            {addDirections.map((direction) => (
              <button
                key={direction}
                type="button"
                onClick={() => addLane(way, direction)}
                className="inline-flex items-center gap-1 rounded-md border border-zinc-300 px-2 py-1 text-xs text-zinc-700 hover:bg-zinc-50"
              >
                <Plus className="size-3" aria-hidden />
                Add {directionLabel(direction)}
              </button>
            ))}
            <button
              type="button"
              disabled={!activeSlot}
              onClick={() => {
                if (!activeSlot) return
                removeLane(way, activeSlot.direction, activeSlot.index, activeSlot)
              }}
              className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2 py-1 text-xs text-red-700 enabled:hover:bg-red-50 disabled:opacity-40"
            >
              <Minus className="size-3" aria-hidden />
              Remove selected
            </button>
          </div>
        </section>
      ) : null}

      {activeSlot ? (
        <section className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-zinc-900">
            Lane {activeSlot.index + 1} ({activeSlot.direction})
          </h3>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Turn</span>
            <input
              type="text"
              disabled={readOnly}
              value={activeSlot.turn ?? ''}
              placeholder="e.g. left|through|right"
              className="rounded-md border border-zinc-300 px-2 py-1.5 text-sm disabled:bg-zinc-50"
              onChange={(event) => updateSlot('turn', event.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Vehicle access</span>
            <input
              type="text"
              disabled={readOnly}
              value={activeSlot.vehicleAccess ?? ''}
              className="rounded-md border border-zinc-300 px-2 py-1.5 text-sm disabled:bg-zinc-50"
              onChange={(event) => updateSlot('vehicleAccess', event.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Bicycle access</span>
            <input
              type="text"
              disabled={readOnly}
              value={activeSlot.bicycleAccess ?? ''}
              className="rounded-md border border-zinc-300 px-2 py-1.5 text-sm disabled:bg-zinc-50"
              onChange={(event) => updateSlot('bicycleAccess', event.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Bus access</span>
            <input
              type="text"
              disabled={readOnly}
              value={activeSlot.busAccess ?? ''}
              className="rounded-md border border-zinc-300 px-2 py-1.5 text-sm disabled:bg-zinc-50"
              onChange={(event) => updateSlot('busAccess', event.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Width (m)</span>
            <input
              type="number"
              min={0}
              step={0.1}
              disabled={readOnly}
              value={activeSlot.widthMeters ?? ''}
              className="rounded-md border border-zinc-300 px-2 py-1.5 text-sm disabled:bg-zinc-50"
              onChange={(event) => {
                const next = Number.parseFloat(event.target.value)
                if (!Number.isFinite(next)) return
                commitSlotUpdate(way, (slots) =>
                  slots.map((slot) => {
                    if (slotKey(slot) !== slotKey(activeSlot)) return slot
                    return { ...slot, widthMeters: next }
                  }),
                )
              }}
            />
          </label>
        </section>
      ) : (
        <p className="m-0 text-sm text-zinc-500">Select a lane in the cross-section below.</p>
      )}

      <button
        type="button"
        onClick={() => setViewMode('table')}
        className="self-start text-sm text-blue-600 hover:underline"
      >
        Open table view
      </button>
    </div>
  )
}
