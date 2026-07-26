import type { OsmFeatureRef } from '@osm-editor-kit/osm-map-url'
import { expandSidepaths } from '@osm-editor-kit/osm-sidepath-tags'
import { ColoredEditorSection } from '../../components/ColoredEditorSection'
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
import { parkingSideColors } from '../parking/side-colors'
import {
  buildHandleGeometry,
  MIN_WIDTH_M,
  offsetPolylineCoordinates,
} from './domain/handle-geometry'
import { roadWidthFromTags } from './domain/road-width-from-tags'
import { viewMinZoom } from './map/constants'
import { useDraftWidthM, useWidthMapActions } from './map/width-map-store'
import { stageWidthOnSidepath, stageWidthOnWay, roundWidthMetres } from './map/width-osm-edits'
import { useWidthOsmQuery } from './map/width-osm-query'
import { useWidthOsmChangeHandler } from './use-width-mode-handlers'

function formatSourceLabel(source: string): string {
  switch (source) {
    case 'width':
      return 'OSM width tag'
    case 'est_width':
      return 'OSM est_width tag'
    case 'highway_default':
      return 'Highway default'
    case 'highway_default_and_oneway':
      return 'Highway default (oneway)'
    default:
      return source
  }
}

function wayCoordinates(
  way: { nodes: number[] },
  nodeCoords: Record<number, number[]> | undefined,
): [number, number][] {
  return way.nodes
    .map((nodeId) => {
      const coord = nodeCoords?.[nodeId]
      if (!coord) return null
      return [coord[1]!, coord[0]!] as [number, number]
    })
    .filter((coord): coord is [number, number] => coord != null)
}

function formatFeatureLabel(ref: OsmFeatureRef): string {
  const suffix = ref.prefix && ref.side ? `/${ref.prefix}/${ref.side}` : ''
  return `${ref.type}/${ref.id}${suffix}`
}

export function WidthModePanel() {
  const onOsmChange = useWidthOsmChangeHandler()
  const mapViewport = useMapViewport()
  const selectedOsmRef = useSelectedOsmRef()
  const authState = useAuthState()
  const { login } = useOsmAuth()
  const draftWidthM = useDraftWidthM()
  const { setDraftWidthM, setHandles } = useWidthMapActions()
  const { data: graph, isFetching } = useWidthOsmQuery({ select: (data) => data.graph })

  if (!selectedOsmRef) {
    return (
      <MapFeaturePromptEmptyState message="Click a highway on the map to inspect and edit its width." />
    )
  }

  const selectedWay =
    selectedOsmRef.type === 'way' ? (graph?.ways[selectedOsmRef.id] ?? null) : null

  if (!selectedWay) {
    return (
      <MapFeatureLoadEmptyState
        zoom={mapViewport.zoom}
        minZoom={viewMinZoom}
        isFetching={isFetching}
        featureLabel={formatFeatureLabel(selectedOsmRef)}
      />
    )
  }

  const isSidepath =
    selectedOsmRef.type === 'way' &&
    (selectedOsmRef.prefix === 'cycleway' || selectedOsmRef.prefix === 'sidewalk') &&
    (selectedOsmRef.side === 'left' || selectedOsmRef.side === 'right')

  const sidepathTags = isSidepath
    ? expandSidepaths(selectedWay.id, selectedWay.tags).find(
        (entry) =>
          entry.ref.prefix === selectedOsmRef.prefix && entry.ref.side === selectedOsmRef.side,
      )?.tags
    : undefined

  const derived = sidepathTags
    ? roadWidthFromTags(sidepathTags)
    : roadWidthFromTags(selectedWay.tags)
  const readOnly = authState !== AuthState.success
  const displayWidth = draftWidthM ?? derived.value
  const coordinates = wayCoordinates(selectedWay, graph?.nodeCoords)

  function applyWidth(widthM: number) {
    if (!selectedOsmRef || !selectedWay) return

    const clamped = Math.max(MIN_WIDTH_M, roundWidthMetres(widthM))
    let handleCoordinates = coordinates

    if (isSidepath && selectedOsmRef.side) {
      const parentWidth = roadWidthFromTags(selectedWay.tags).value
      handleCoordinates = offsetPolylineCoordinates(
        coordinates,
        parentWidth / 2,
        selectedOsmRef.side,
      )
    }

    setDraftWidthM(clamped)
    setHandles(buildHandleGeometry(handleCoordinates, clamped))

    if (isSidepath && selectedOsmRef.prefix && selectedOsmRef.side) {
      onOsmChange(
        stageWidthOnSidepath(selectedWay, selectedOsmRef.prefix, selectedOsmRef.side, clamped),
      )
      return
    }

    onOsmChange(stageWidthOnWay(selectedWay, clamped))
  }

  const featureSuffix =
    isSidepath && selectedOsmRef.prefix && selectedOsmRef.side
      ? `${selectedOsmRef.prefix}/${selectedOsmRef.side}`
      : undefined

  return (
    <div className="flex min-w-[250px] flex-col gap-4 text-zinc-900">
      <ModePanelIntro
        wayId={selectedWay.id}
        highway={selectedWay.tags.highway}
        featureSuffix={featureSuffix}
        className="flex items-center gap-2"
      />

      {readOnly ? <LoginCallout onLogin={() => void login()} /> : null}

      <ColoredEditorSection
        aria-label="Width"
        title="Width"
        color={parkingSideColors.right}
        className="mb-0"
        contentClassName="flex flex-col gap-1.5 py-2"
      >
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
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm disabled:bg-zinc-50"
          onChange={(event) => {
            const next = Number.parseFloat(event.target.value)
            if (!Number.isFinite(next)) return
            applyWidth(next)
          }}
        />
        <p className="m-0 text-xs text-zinc-500">
          Derived hint: {derived.value} m ({formatSourceLabel(derived.source)})
        </p>
      </ColoredEditorSection>
    </div>
  )
}
