import type { OsmWay } from '@osm-editor-kit/osm-data'
import { wayHasSplittableInterior } from '@osm-editor-kit/osm-way-edit'
import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useRef } from 'react'
import type { MapLayerMouseEvent } from 'react-map-gl/maplibre'
import { addChangedEntity } from '../../utils/changes-store'
import { AuthState, useAppActions, useAuthState } from '../app-store'
import { useFeatureSelection, useSelectedOsmRef } from './feature-selection'
import { useOsmCoverageQuery } from './osm-coverage-query'
import { getOsmWayFromSession } from './osm-session-way-edits'
import { cutOsmWayInSession } from './way-cut-edits'
import { useWayCutActions, useWayCutMarkers, type WayCutMarkerFeature } from './way-cut-store'

export const WAY_CUT_MARKERS_HITAREA_LAYER_ID = 'way-cut-markers-hitarea-layer'
export const WAY_CUT_MARKERS_LAYER_PREFIX = 'way-cut-markers'

export type SplitWayDisabledReason =
  | 'sign-in'
  | 'select-way'
  | 'in-relation'
  | 'no-interior-node'
  | null

export function useSplitWayAvailability(): {
  disabledReason: SplitWayDisabledReason
  selectedWay: OsmWay | null
  isCutActive: boolean
} {
  const authState = useAuthState()
  const selectedOsmRef = useSelectedOsmRef()
  const cutMarkers = useWayCutMarkers()
  const { data: graph } = useOsmCoverageQuery({ select: (data) => data.graph })

  const selectedWay =
    selectedOsmRef?.type === 'way' ? (graph?.ways[selectedOsmRef.id] ?? null) : null

  let disabledReason: SplitWayDisabledReason = null
  if (authState !== AuthState.success) {
    disabledReason = 'sign-in'
  } else if (!selectedWay) {
    disabledReason = 'select-way'
  } else if (graph?.waysInRelation[selectedWay.id]) {
    disabledReason = 'in-relation'
  } else if (!wayHasSplittableInterior(selectedWay)) {
    disabledReason = 'no-interior-node'
  }

  return {
    disabledReason,
    selectedWay,
    isCutActive: cutMarkers.features.length > 0,
  }
}

export function splitWayDisabledTooltip(reason: SplitWayDisabledReason): string | null {
  switch (reason) {
    case 'sign-in':
      return 'Sign in to split a way'
    case 'select-way':
      return 'Select a way to split'
    case 'in-relation':
      return 'Ways that are members of a relation can’t be split here'
    case 'no-interior-node':
      return 'This way has no interior nodes to split at'
    default:
      return null
  }
}

export function useWayCutHandler() {
  const queryClient = useQueryClient()
  const authState = useAuthState()
  const { data: graph } = useOsmCoverageQuery({ select: (data) => data.graph })
  const cutMarkers = useWayCutMarkers()
  const selectedOsmRef = useSelectedOsmRef()
  const { setCutMarkers, clearCutMarkers } = useWayCutActions()
  const { updateFeatureRef } = useFeatureSelection()
  const { setChangesCount } = useAppActions()
  const newWayIdRef = useRef(-1)

  const showCutMarkers = useCallback(
    (osm: OsmWay) => {
      if (authState !== AuthState.success) return
      if (graph?.waysInRelation[osm.id]) return
      if (!wayHasSplittableInterior(osm)) return

      const nodeCoords = graph?.nodeCoords ?? {}
      const markers: WayCutMarkerFeature[] = osm.nodes
        .slice(1, -1)
        .flatMap((nd): WayCutMarkerFeature[] => {
          const coord = nodeCoords[nd]
          if (!coord) return []
          return [
            {
              type: 'Feature',
              id: `cut-${nd}`,
              geometry: { type: 'Point', coordinates: [coord[1]!, coord[0]!] },
              properties: {
                featureId: `cut-${nd}`,
                kind: 'cut-marker',
                color: '#fffc7e',
                weight: 8,
                osmType: 'node',
                osmId: nd,
                nodeId: nd,
                wayId: osm.id,
              },
            },
          ]
        })

      setCutMarkers({ type: 'FeatureCollection', features: markers })
    },
    [authState, graph, setCutMarkers],
  )

  const cancelCut = useCallback(() => {
    clearCutMarkers()
  }, [clearCutMarkers])

  const handleCutMarkerClick = useCallback(
    (event: MapLayerMouseEvent) => {
      if (authState !== AuthState.success) return

      const nodeId = event.features?.[0]?.properties?.nodeId as number | undefined
      const wayId = event.features?.[0]?.properties?.wayId as number | undefined
      if (!nodeId || !wayId) return

      const original = getOsmWayFromSession(queryClient, wayId)
      const result = cutOsmWayInSession(queryClient, wayId, nodeId, newWayIdRef.current--)
      if (!result) return

      clearCutMarkers()

      if (selectedOsmRef?.type === 'way' && selectedOsmRef.id === wayId) {
        updateFeatureRef({ type: 'way', id: result.oldWay.id })
      }

      addChangedEntity(result.newWay, { source: 'split' })
      const changesCount = addChangedEntity(result.oldWay, { original, source: 'split' })
      setChangesCount(changesCount)
      event.originalEvent.stopPropagation()
    },
    [authState, clearCutMarkers, queryClient, selectedOsmRef, setChangesCount, updateFeatureRef],
  )

  const toggleCutForSelectedWay = useCallback(() => {
    if (cutMarkers.features.length > 0) {
      clearCutMarkers()
      return
    }
    if (!selectedOsmRef || selectedOsmRef.type !== 'way') return
    const way = graph?.ways[selectedOsmRef.id]
    if (!way) return
    showCutMarkers(way)
  }, [clearCutMarkers, cutMarkers.features.length, graph?.ways, selectedOsmRef, showCutMarkers])

  return {
    showCutMarkers,
    cancelCut,
    handleCutMarkerClick,
    toggleCutForSelectedWay,
    isCutActive: cutMarkers.features.length > 0,
  }
}
