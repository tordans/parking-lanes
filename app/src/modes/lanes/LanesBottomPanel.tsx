import * as m from '@app/paraglide/messages'
import { parseWayLanes } from '@osm-editor-kit/osm-lanes'
import { AlertTriangle } from 'lucide-react'
import { useCallback, useEffect, useRef } from 'react'
import { AuthState, useAuthState } from '../../shell/app-store'
import {
  MapFeatureLoadEmptyState,
  MapFeaturePromptEmptyState,
} from '../../shell/controls/MapFeatureEmptyState'
import { ModePanelIntro } from '../../shell/controls/ModePanelIntro'
import { useFeatureSelection, useSelectedOsmRef } from '../../shell/map/feature-selection'
import { useMapViewport } from '../../shell/map/map-viewport'
import { LoginCallout } from '../parking/controls/LoginCallout'
import { useOsmAuth } from '../parking/map/use-osm-auth'
import { ChainNavigator } from './components/ChainNavigator'
import { LaneCrossSection } from './components/LaneCrossSection'
import { LanesSlotEditor } from './components/LanesSlotEditor'
import { LanesTagTable } from './components/LanesTagTable'
import { LanesViewToggle } from './components/LanesViewToggle'
import { LanesWaySummary } from './components/LanesWaySummary'
import { screenOrderedChainNeighbors } from './domain/screen-ordered-neighbors'
import { useLanesChainBuilder, useVisibleChainSegments } from './domain/use-lanes-chain'
import { viewMinZoom } from './map/constants'
import { lanesNextNeighborColor, lanesPrevNeighborColor } from './map/lanes-layer-paint'
import {
  useLanesChain,
  useLanesMapActions,
  useLanesPendingJunctions,
  useLanesViewMode,
  useSelectedLaneSlot,
} from './map/lanes-map-store'
import { useIsLanesOsmFetching, useLanesOsmQuery } from './map/lanes-osm-query'
import { useLanesFlyToWay } from './use-lanes-fly-to-way'
import { useLanesModeHandlers } from './use-lanes-mode-handlers'

function segmentLabel(tags: Record<string, string>, wayId: number): string {
  if (tags.name) return tags.name
  if (tags.ref) return tags.ref
  return `Way ${wayId}`
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable
}

export function LanesBottomPanel() {
  const selectedOsmRef = useSelectedOsmRef()
  const { selectFeature } = useFeatureSelection()
  const centerWayId = selectedOsmRef?.type === 'way' ? selectedOsmRef.id : undefined
  const chain = useLanesChain()
  const pendingJunctions = useLanesPendingJunctions()
  const viewMode = useLanesViewMode()
  const selectedSlot = useSelectedLaneSlot()
  const { selectSlot, setViewMode } = useLanesMapActions()
  const { extendAtJunction } = useLanesChainBuilder(centerWayId)
  const visibleSegments = useVisibleChainSegments(centerWayId)
  const panelRef = useRef<HTMLDivElement>(null)
  const authState = useAuthState()
  const readOnly = authState !== AuthState.success
  const { login } = useOsmAuth()
  const flyToWay = useLanesFlyToWay()
  const { addLane, removeLane, editableLaneDirections, commitSlotUpdate } = useLanesModeHandlers()
  const mapViewport = useMapViewport()
  const { data: graph } = useLanesOsmQuery({ select: (data) => data.graph })
  const isFetching = useIsLanesOsmFetching()

  const centerWay = centerWayId != null ? (graph?.ways[centerWayId] ?? null) : null

  const centerIndex =
    chain && centerWayId != null ? chain.segments.findIndex((s) => s.id === centerWayId) : -1
  const prevSegment = visibleSegments.find(
    (s) => s.id !== centerWayId && chain?.segments[centerIndex - 1]?.id === s.id,
  )
  const nextSegment = visibleSegments.find(
    (s) => s.id !== centerWayId && chain?.segments[centerIndex + 1]?.id === s.id,
  )
  const centerSegment = visibleSegments.find((s) => s.id === centerWayId)
  const { left: leftNeighbor, right: rightNeighbor } = screenOrderedChainNeighbors(
    prevSegment,
    nextSegment,
    centerSegment,
    mapViewport.bearing ?? 0,
  )

  const walkToWay = useCallback(
    (wayId: number) => {
      selectFeature({ type: 'way', id: wayId })
      flyToWay(wayId)
    },
    [flyToWay, selectFeature],
  )

  useEffect(
    function keyboardWalkAlongStreet() {
      const panel = panelRef.current
      if (!panel) return

      function onKeyDown(event: KeyboardEvent) {
        if (isTypingTarget(event.target)) return

        if (event.key === 'ArrowLeft') {
          event.preventDefault()
          if (leftNeighbor) walkToWay(leftNeighbor.id)
        } else if (event.key === 'ArrowRight') {
          event.preventDefault()
          if (rightNeighbor) walkToWay(rightNeighbor.id)
        } else if (event.key === 'Escape') {
          selectSlot(null)
        }
      }

      panel.addEventListener('keydown', onKeyDown)
      return () => panel.removeEventListener('keydown', onKeyDown)
    },
    [leftNeighbor, rightNeighbor, selectSlot, walkToWay],
  )

  if (!centerWayId) {
    return <MapFeaturePromptEmptyState message={m.empty_click_lanes()} />
  }

  if (!centerWay) {
    return (
      <MapFeatureLoadEmptyState
        zoom={mapViewport.zoom}
        minZoom={viewMinZoom}
        isFetching={isFetching}
        featureLabel={`way/${centerWayId}`}
      />
    )
  }

  const centerModel = parseWayLanes(centerWay.tags)
  const centerWarnings = centerModel.warnings
  const hasErrors = centerWarnings.some((warning) => warning.severity === 'error')
  const addDirections = editableLaneDirections(centerModel)

  const selectedSlotKey =
    selectedSlot && selectedSlot.wayId === centerWayId
      ? `${selectedSlot.direction}:${selectedSlot.index}`
      : null

  const activeSlot = selectedSlot
    ? centerModel.slots.find(
        (slot) => slot.direction === selectedSlot.direction && slot.index === selectedSlot.index,
      )
    : undefined

  const columnSlots: Array<{
    segment: (typeof visibleSegments)[number] | null
    role: 'prev' | 'center' | 'next' | 'empty-left' | 'empty-right'
    labelColor?: string
  }> = [
    {
      segment: leftNeighbor,
      role: leftNeighbor ? (leftNeighbor.id === prevSegment?.id ? 'prev' : 'next') : 'empty-left',
      labelColor:
        leftNeighbor == null
          ? undefined
          : leftNeighbor.id === prevSegment?.id
            ? lanesPrevNeighborColor
            : lanesNextNeighborColor,
    },
    { segment: centerSegment ?? null, role: 'center' },
    {
      segment: rightNeighbor,
      role: rightNeighbor
        ? rightNeighbor.id === nextSegment?.id
          ? 'next'
          : 'prev'
        : 'empty-right',
      labelColor:
        rightNeighbor == null
          ? undefined
          : rightNeighbor.id === prevSegment?.id
            ? lanesPrevNeighborColor
            : lanesNextNeighborColor,
    },
  ]

  return (
    <div
      ref={panelRef}
      tabIndex={0}
      className="flex h-full flex-col gap-3 overflow-hidden p-3 outline-none"
    >
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <ModePanelIntro
            wayId={centerWay.id}
            highway={centerWay.tags.highway}
            identityStart
            className="flex min-w-0 items-center gap-2"
          />
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <LanesViewToggle mode={viewMode} onChange={setViewMode} />
            <ChainNavigator
              pendingJunctions={pendingJunctions}
              onJunctionPick={(choice, wayId) => {
                if (!chain) return
                void extendAtJunction(choice, wayId, chain).then(() => walkToWay(wayId))
              }}
            />
          </div>
        </div>
        <LanesWaySummary way={centerWay} />
        {readOnly ? <LoginCallout onLogin={() => void login()} /> : null}
      </div>

      {centerWarnings.length > 0 ? (
        <div
          className={
            hasErrors
              ? 'flex items-start gap-2 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-900'
              : 'flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900'
          }
          role="alert"
        >
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          <span>{centerWarnings.map((w) => w.message).join(' · ')}</span>
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1 gap-3">
        {viewMode === 'table' ? (
          <div className="min-h-0 flex-1 overflow-auto">
            <LanesTagTable segments={chain?.segments ?? []} centerWayId={centerWayId} />
          </div>
        ) : (
          <div className="grid min-h-0 flex-1 grid-cols-3 gap-3">
            {columnSlots.map(({ segment, role, labelColor }) => {
              if (!segment) {
                return (
                  <div
                    key={role}
                    className="flex items-center justify-center rounded-md border border-dashed border-zinc-200 text-xs text-zinc-400"
                  />
                )
              }

              const model = parseWayLanes(segment.tags)
              const isCenter = role === 'center'
              return (
                <LaneCrossSection
                  key={segment.id}
                  slots={model.slots}
                  wayId={segment.id}
                  selectedSlotKey={isCenter ? selectedSlotKey : null}
                  highlighted={isCenter}
                  center={isCenter}
                  label={segmentLabel(segment.tags, segment.id)}
                  labelColor={labelColor}
                  readOnly={readOnly}
                  addDirections={isCenter ? addDirections : undefined}
                  canRemoveLane={isCenter && Boolean(activeSlot)}
                  onAddLane={isCenter ? (direction) => addLane(centerWay, direction) : undefined}
                  onRemoveLane={
                    isCenter && activeSlot
                      ? () =>
                          removeLane(centerWay, activeSlot.direction, activeSlot.index, activeSlot)
                      : undefined
                  }
                  onSelectSlot={(wayId, slot) =>
                    selectSlot({ wayId, direction: slot.direction, index: slot.index })
                  }
                  onSelectSegment={isCenter ? undefined : () => walkToWay(segment.id)}
                />
              )
            })}
          </div>
        )}

        {activeSlot ? (
          <div className="w-72 shrink-0 overflow-y-auto">
            <LanesSlotEditor
              slot={activeSlot}
              readOnly={readOnly}
              onCommitSlotUpdate={(updater) => commitSlotUpdate(centerWay, updater)}
            />
          </div>
        ) : null}
      </div>
    </div>
  )
}
