import * as m from '@app/paraglide/messages'
import { parseWayLanes } from '@osm-editor-kit/osm-lanes'
import { AlertTriangle } from 'lucide-react'
import { useCallback, useEffect, useRef } from 'react'
import { AuthState, useAuthState } from '../../shell/app-store'
import { useFeatureSelection, useSelectedOsmRef } from '../../shell/map/feature-selection'
import { LoginCallout } from '../parking/controls/LoginCallout'
import { useOsmAuth } from '../parking/map/use-osm-auth'
import { ChainNavigator } from './components/ChainNavigator'
import { LaneCrossSection } from './components/LaneCrossSection'
import { LanesSlotEditor } from './components/LanesSlotEditor'
import { LanesTagTable } from './components/LanesTagTable'
import { LanesViewToggle } from './components/LanesViewToggle'
import { LanesWaySummary } from './components/LanesWaySummary'
import { useLanesChainBuilder, useVisibleChainSegments } from './domain/use-lanes-chain'
import {
  useLanesChain,
  useLanesMapActions,
  useLanesPendingJunctions,
  useLanesViewMode,
  useSelectedLaneSlot,
} from './map/lanes-map-store'
import { useLanesOsmQuery } from './map/lanes-osm-query'
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

  const { data: graph } = useLanesOsmQuery({ select: (data) => data.graph })

  const walkToWay = useCallback(
    (wayId: number) => {
      selectFeature({ type: 'way', id: wayId })
      flyToWay(wayId)
    },
    [flyToWay, selectFeature],
  )

  const handlePrev = useCallback(() => {
    if (!chain || centerWayId == null) return
    const centerIndex = chain.segments.findIndex((s) => s.id === centerWayId)
    const prev = centerIndex > 0 ? chain.segments[centerIndex - 1] : undefined
    if (prev) walkToWay(prev.id)
  }, [centerWayId, chain, walkToWay])

  const handleNext = useCallback(() => {
    if (!chain || centerWayId == null) return
    const centerIndex = chain.segments.findIndex((s) => s.id === centerWayId)
    const next =
      centerIndex >= 0 && centerIndex < chain.segments.length - 1
        ? chain.segments[centerIndex + 1]
        : undefined
    if (next) walkToWay(next.id)
  }, [centerWayId, chain, walkToWay])

  useEffect(
    function keyboardWalkAlongStreet() {
      const panel = panelRef.current
      if (!panel) return

      function onKeyDown(event: KeyboardEvent) {
        if (isTypingTarget(event.target)) return

        if (event.key === 'ArrowLeft') {
          event.preventDefault()
          handlePrev()
        } else if (event.key === 'ArrowRight') {
          event.preventDefault()
          handleNext()
        } else if (event.key === 'Escape') {
          selectSlot(null)
        }
      }

      panel.addEventListener('keydown', onKeyDown)
      return () => panel.removeEventListener('keydown', onKeyDown)
    },
    [handleNext, handlePrev, selectSlot],
  )

  if (!centerWayId || !graph) {
    return (
      <div className="flex h-full items-center justify-center px-4 text-sm text-zinc-500">
        {m.empty_click_lanes()}
      </div>
    )
  }

  const centerWay = graph.ways[centerWayId]
  const centerModel = centerWay ? parseWayLanes(centerWay.tags) : null
  const centerWarnings = centerModel?.warnings ?? []
  const hasErrors = centerWarnings.some((warning) => warning.severity === 'error')
  const addDirections = centerModel ? editableLaneDirections(centerModel) : []

  const centerIndex = chain ? chain.segments.findIndex((s) => s.id === centerWayId) : -1
  const canPrev = centerIndex > 0
  const canNext = chain != null && centerIndex >= 0 && centerIndex < chain.segments.length - 1

  const selectedSlotKey =
    selectedSlot && selectedSlot.wayId === centerWayId
      ? `${selectedSlot.direction}:${selectedSlot.index}`
      : null

  const activeSlot =
    selectedSlot && centerModel
      ? centerModel.slots.find(
          (slot) => slot.direction === selectedSlot.direction && slot.index === selectedSlot.index,
        )
      : undefined

  const prevSegment = visibleSegments.find(
    (s) => s.id !== centerWayId && chain?.segments[centerIndex - 1]?.id === s.id,
  )
  const nextSegment = visibleSegments.find(
    (s) => s.id !== centerWayId && chain?.segments[centerIndex + 1]?.id === s.id,
  )
  const centerSegment = visibleSegments.find((s) => s.id === centerWayId)

  const columnSlots: Array<{
    segment: (typeof visibleSegments)[number] | null
    position: 'prev' | 'center' | 'next'
  }> = [
    { segment: prevSegment ?? null, position: 'prev' },
    { segment: centerSegment ?? null, position: 'center' },
    { segment: nextSegment ?? null, position: 'next' },
  ]

  return (
    <div
      ref={panelRef}
      tabIndex={0}
      className="flex h-full flex-col gap-3 overflow-hidden p-3 outline-none"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <LanesWaySummary way={centerWay} />
          {readOnly ? <LoginCallout onLogin={() => void login()} /> : null}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <ChainNavigator
            onPrev={handlePrev}
            onNext={handleNext}
            canPrev={canPrev}
            canNext={canNext}
            pendingJunctions={pendingJunctions}
            onJunctionPick={(choice, wayId) => {
              if (!chain) return
              void extendAtJunction(choice, wayId, chain).then(() => walkToWay(wayId))
            }}
          />
          <LanesViewToggle mode={viewMode} onChange={setViewMode} />
        </div>
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
            {columnSlots.map(({ segment, position }) => {
              if (!segment) {
                return (
                  <div
                    key={position}
                    className="flex items-center justify-center rounded-md border border-dashed border-zinc-200 text-xs text-zinc-400"
                  >
                    {position === 'prev' ? '←' : position === 'next' ? '→' : ''}
                  </div>
                )
              }

              const model = parseWayLanes(segment.tags)
              const isCenter = position === 'center'
              return (
                <LaneCrossSection
                  key={segment.id}
                  slots={model.slots}
                  wayId={segment.id}
                  selectedSlotKey={isCenter ? selectedSlotKey : null}
                  highlighted={isCenter}
                  center={isCenter}
                  label={segmentLabel(segment.tags, segment.id)}
                  readOnly={readOnly}
                  addDirections={isCenter ? addDirections : undefined}
                  canRemoveLane={isCenter && Boolean(activeSlot)}
                  onAddLane={
                    isCenter && centerWay ? (direction) => addLane(centerWay, direction) : undefined
                  }
                  onRemoveLane={
                    isCenter && centerWay && activeSlot
                      ? () =>
                          removeLane(centerWay, activeSlot.direction, activeSlot.index, activeSlot)
                      : undefined
                  }
                  onSelectSlot={(wayId, slot) =>
                    selectSlot({ wayId, direction: slot.direction, index: slot.index })
                  }
                  onSelectSegment={() => walkToWay(segment.id)}
                />
              )
            })}
          </div>
        )}

        {activeSlot && centerWay ? (
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
