import { AuthState, useAuthState } from '../../shell/app-store'
import { useSelectedOsmRef } from '../../shell/map/feature-selection'
import { useMapViewport } from '../../shell/map/map-viewport'
import { LoginCallout } from '../parking/controls/LoginCallout'
import { useOsmAuth } from '../parking/map/use-osm-auth'
import type { ModePanelProps } from '../types'
import { buildHandleGeometry, MIN_WIDTH_M } from './domain/handle-geometry'
import { roadWidthFromTags } from './domain/road-width-from-tags'
import { viewMinZoom } from './map/constants'
import { useDraftWidthM, useWidthMapActions } from './map/width-map-store'
import { stageWidthOnWay } from './map/width-osm-edits'
import { useWidthOsmQuery } from './map/width-osm-query'

function formatSourceLabel(source: string): string {
  switch (source) {
    case 'tag':
      return 'OSM width tag'
    case 'highway_default':
      return 'Highway default'
    case 'highway_default_and_oneway':
      return 'Highway default (oneway)'
    default:
      return source
  }
}

export function WidthModePanel(props: ModePanelProps) {
  const mapViewport = useMapViewport()
  const selectedOsmRef = useSelectedOsmRef()
  const authState = useAuthState()
  const { login } = useOsmAuth()
  const draftWidthM = useDraftWidthM()
  const { setDraftWidthM, setHandles } = useWidthMapActions()
  const { data: graph, isFetching } = useWidthOsmQuery({ select: (data) => data.graph })

  if (!selectedOsmRef) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center text-sm text-zinc-600">
        <p className="m-0">Click a highway on the map to inspect and edit its width.</p>
      </div>
    )
  }

  const selectedWay =
    selectedOsmRef.type === 'way' ? (graph?.ways[selectedOsmRef.id] ?? null) : null

  if (!selectedWay) {
    const belowMinZoom = mapViewport.zoom < viewMinZoom
    return (
      <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center text-sm text-zinc-600">
        {belowMinZoom ? (
          <p className="m-0">Zoom in to load this feature.</p>
        ) : isFetching ? (
          <p className="m-0">Loading feature…</p>
        ) : (
          <p className="m-0">
            Feature {selectedOsmRef.type}/{selectedOsmRef.id} is not in the loaded area. Pan the map
            to load it.
          </p>
        )}
      </div>
    )
  }

  const derived = roadWidthFromTags(selectedWay.tags)
  const readOnly = authState !== AuthState.success
  const displayWidth = draftWidthM ?? derived.value

  function applyWidth(widthM: number) {
    const clamped = Math.max(MIN_WIDTH_M, widthM)
    const coordinates = selectedWay!.nodes
      .map((nodeId) => {
        const coord = graph?.nodeCoords[nodeId]
        if (!coord) return null
        return [coord[1]!, coord[0]!] as [number, number]
      })
      .filter((coord): coord is [number, number] => coord != null)

    setDraftWidthM(clamped)
    setHandles(buildHandleGeometry(coordinates, clamped))
    props.onOsmChange(stageWidthOnWay(selectedWay!, clamped))
  }

  return (
    <div className="flex min-w-[250px] flex-col gap-4 text-zinc-900">
      <div className="text-sm text-zinc-700">
        <a
          href={`https://openstreetmap.org/way/${selectedWay.id}`}
          target="_blank"
          rel="noreferrer"
          className="text-blue-600 hover:underline"
        >
          Way {selectedWay.id}
        </a>
        {selectedWay.tags.highway ? (
          <span className="text-zinc-500"> · {selectedWay.tags.highway}</span>
        ) : null}
      </div>

      {readOnly ? <LoginCallout onLogin={() => void login()} /> : null}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="width-input" className="text-sm font-medium text-zinc-900">
          Width (m)
        </label>
        <input
          id="width-input"
          type="number"
          min={1}
          step={0.1}
          value={displayWidth}
          disabled={readOnly}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm disabled:bg-zinc-50"
          onChange={(event) => {
            const next = Number.parseFloat(event.target.value)
            if (!Number.isFinite(next)) return
            applyWidth(next)
          }}
        />
        <p className="m-0 text-xs text-zinc-500">
          Derived hint: {derived.value} m ({formatSourceLabel(derived.source)})
        </p>
      </div>
    </div>
  )
}
