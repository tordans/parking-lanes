import * as m from '@app/paraglide/messages'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useRef } from 'react'
import { AuthState, useAuthState } from '../../shell/app-store'
import { ChainNavigator } from '../../shell/controls/ChainNavigator'
import { MapFeatureLoadEmptyState } from '../../shell/controls/MapFeatureEmptyState'
import { ModePanelIntro } from '../../shell/controls/ModePanelIntro'
import { useChainWalk } from '../../shell/controls/use-chain-walk'
import {
  useFeatureSelectionActions,
  useSelectedOsmRef,
} from '../../shell/map/feature-selection-store'
import { useMapViewport } from '../../shell/map/map-viewport'
import { useOsmCoverageQuery, useIsOsmCoverageFetching } from '../../shell/map/osm-coverage-query'
import { useWayChainBuilder } from '../../shell/map/use-way-chain-builder'
import { viewMinZoom } from '../lanes/map/constants'
import { LoginCallout } from '../parking/controls/LoginCallout'
import { useOsmAuth } from '../parking/map/use-osm-auth'
import { PropagateSuggestions } from './components/PropagateSuggestions'
import { TagDiffTable } from './components/TagDiffTable'
import { suggestPropagateFromCenter, type PropagateSuggestion } from './domain/suggestions'
import { applyTableTagToWay, resolveTableEditBaseWay } from './domain/table-edits'
import { buildTagRows } from './domain/tag-diff'
import { useTableChain, useTableMapActions, useTablePendingJunctions } from './map/table-map-store'
import { useTableOsmChangeHandler } from './use-table-mode-handlers'

const CHAIN_MAX_PER_SIDE = 5

export function TableBottomPanel() {
  const selectedOsmRef = useSelectedOsmRef()
  const centerWayId = selectedOsmRef?.type === 'way' ? selectedOsmRef.id : undefined
  const { selectFeature } = useFeatureSelectionActions()
  const chain = useTableChain()
  const pendingJunctions = useTablePendingJunctions()
  const { setChainResult } = useTableMapActions()
  const { extendAtJunction } = useWayChainBuilder({
    centerWayId,
    maxPerSide: CHAIN_MAX_PER_SIDE,
    setChainResult,
  })
  const { data: graph } = useOsmCoverageQuery({ select: (data) => data.graph })
  const isFetching = useIsOsmCoverageFetching()
  const mapViewport = useMapViewport()
  const authState = useAuthState()
  const readOnly = authState !== AuthState.success
  const { login } = useOsmAuth()
  const handleOsmChange = useTableOsmChangeHandler()
  const panelRef = useRef<HTMLDivElement>(null)

  function walkToWay(wayId: number) {
    selectFeature({ type: 'way', id: wayId })
  }

  const { prevWayId, nextWayId, walkPrev, walkNext } = useChainWalk({
    chain,
    centerWayId,
    walkToWay,
    axis: 'horizontal',
    containerRef: panelRef,
  })

  if (!centerWayId) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <p className="text-sm text-zinc-600">{m.empty_click_table()}</p>
      </div>
    )
  }

  const centerWay = graph?.ways[centerWayId] ?? null
  if (!centerWay) {
    return (
      <div className="h-full overflow-y-auto p-3">
        <MapFeatureLoadEmptyState
          zoom={mapViewport.zoom}
          minZoom={viewMinZoom}
          isFetching={isFetching}
          featureLabel={`way/${centerWayId}`}
        />
      </div>
    )
  }

  if (!chain) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <p className="text-sm text-zinc-500">{m.table_building_chain()}</p>
      </div>
    )
  }

  const activeChain = chain
  const rows = buildTagRows(activeChain)
  const suggestions = suggestPropagateFromCenter(
    activeChain.segments,
    activeChain.centerIndex,
    rows,
  )

  function commitDisplayKey(segmentId: number, displayKey: string, value: string | undefined) {
    if (readOnly || !graph) return
    const base = resolveTableEditBaseWay(segmentId, graph.ways[segmentId])
    if (!base) return
    const segment = activeChain.segments.find((s) => s.id === segmentId)
    handleOsmChange(applyTableTagToWay(base, displayKey, value, segment?.reversed))
  }

  function commitCell(segmentId: number, key: string, value: string) {
    commitDisplayKey(segmentId, key, value === '' ? undefined : value)
  }

  function clearCell(segmentId: number, key: string) {
    commitDisplayKey(segmentId, key, undefined)
  }

  function applySuggestion(suggestion: PropagateSuggestion) {
    if (readOnly || !graph) return
    for (const wayId of suggestion.affectedWayIds) {
      const base = resolveTableEditBaseWay(wayId, graph.ways[wayId])
      if (!base) continue
      const segment = activeChain.segments.find((s) => s.id === wayId)
      handleOsmChange(applyTableTagToWay(base, suggestion.key, suggestion.value, segment?.reversed))
    }
  }

  return (
    <div
      ref={panelRef}
      tabIndex={0}
      className="flex h-full flex-col gap-3 overflow-y-auto p-3 outline-none"
    >
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                disabled={prevWayId == null}
                aria-label={m.chain_prev_segment()}
                title={m.chain_prev_segment()}
                onClick={walkPrev}
                className="rounded border border-zinc-300 p-1 text-zinc-700 hover:bg-zinc-50 disabled:opacity-40"
              >
                <ChevronLeft className="size-4" aria-hidden />
              </button>
              <button
                type="button"
                disabled={nextWayId == null}
                aria-label={m.chain_next_segment()}
                title={m.chain_next_segment()}
                onClick={walkNext}
                className="rounded border border-zinc-300 p-1 text-zinc-700 hover:bg-zinc-50 disabled:opacity-40"
              >
                <ChevronRight className="size-4" aria-hidden />
              </button>
            </div>
            <ModePanelIntro
              wayId={centerWay.id}
              highway={centerWay.tags.highway}
              identityStart
              className="flex min-w-0 items-center gap-2"
            />
          </div>
          <ChainNavigator
            pendingJunctions={pendingJunctions}
            onJunctionPick={(choice, wayId) => {
              void extendAtJunction(choice, wayId, activeChain).then(() => walkToWay(wayId))
            }}
          />
        </div>

        {readOnly ? <LoginCallout onLogin={() => void login()} /> : null}
      </div>

      <TagDiffTable
        segments={activeChain.segments}
        centerIndex={activeChain.centerIndex}
        rows={rows}
        editable={!readOnly}
        selectedSegmentId={centerWayId}
        onSelectSegment={walkToWay}
        onCellChange={commitCell}
        onCellClear={clearCell}
      />

      <PropagateSuggestions
        suggestions={suggestions}
        disabled={readOnly}
        onApply={applySuggestion}
      />
    </div>
  )
}
