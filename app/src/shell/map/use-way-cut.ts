import type { OsmWay } from '@osm-editor-kit/osm-data'
import {
  assessWaySplitRegardingRelations,
  wayCanSplit,
  wayHasSplittableInterior,
} from '@osm-editor-kit/osm-way-edit'
import { useQueryClient } from '@tanstack/react-query'
import { lineString, point } from '@turf/helpers'
import nearestPointOnLine from '@turf/nearest-point-on-line'
import { useCallback, useRef } from 'react'
import type { MapLayerMouseEvent } from 'react-map-gl/maplibre'
import { addChangedEntity, addChangedNode, addChangedRelation } from '../../utils/changes-store'
import { AuthState, useAuthState } from '../app-store'
import { useFeatureSelectionActions, useSelectedOsmRef } from './feature-selection-store'
import { recordEditingImagery } from './imagery-usage-session'
import { useOsmCoverageQuery } from './osm-coverage-query'
import { getOsmWayFromSession } from './osm-session-way-edits'
import {
  cutOsmWayInSession,
  insertNodeAndCutOsmWayInSession,
  type CutOsmWayResult,
} from './way-cut-edits'
import {
  useIsCutActive,
  useWayCutActions,
  useWayCutPreview,
  type WayCutMarkerFeature,
  type WayCutPreview,
} from './way-cut-store'

export const WAY_CUT_MARKERS_HITAREA_LAYER_ID = 'way-cut-markers-hitarea-layer'
export const WAY_CUT_MARKERS_LAYER_PREFIX = 'way-cut-markers'
export const WAY_CUT_PREVIEW_HITAREA_LAYER_ID = 'way-cut-preview-hitarea-layer'
const CUT_PROXIMITY_PX = 15

export type SplitWayDisabledReason =
  | 'sign-in'
  | 'select-way'
  | 'parent_incomplete'
  | 'simple_roundabout'
  | 'too-few-nodes'
  | null

export function useSplitWayAvailability(): {
  disabledReason: SplitWayDisabledReason
  selectedWay: OsmWay | null
  isCutActive: boolean
} {
  const authState = useAuthState()
  const selectedOsmRef = useSelectedOsmRef()
  const isCutActive = useIsCutActive()
  const { data: graph } = useOsmCoverageQuery({ select: (data) => data.graph })

  const selectedWay =
    selectedOsmRef?.type === 'way' ? (graph?.ways[selectedOsmRef.id] ?? null) : null

  let disabledReason: SplitWayDisabledReason = null
  if (authState !== AuthState.success) {
    disabledReason = 'sign-in'
  } else if (!selectedWay) {
    disabledReason = 'select-way'
  } else if (graph) {
    const relationAssessment = assessWaySplitRegardingRelations(graph, selectedWay.id)
    if (relationAssessment === 'parent_incomplete') {
      disabledReason = 'parent_incomplete'
    } else if (relationAssessment === 'simple_roundabout') {
      disabledReason = 'simple_roundabout'
    }
  }

  if (disabledReason == null && selectedWay && !wayCanSplit(selectedWay)) {
    disabledReason = 'too-few-nodes'
  }

  return {
    disabledReason,
    selectedWay,
    isCutActive,
  }
}

export function splitWayDisabledTooltip(reason: SplitWayDisabledReason): string | null {
  switch (reason) {
    case 'sign-in':
      return 'Sign in to split a way'
    case 'select-way':
      return 'Select a way to split'
    case 'parent_incomplete':
      return 'Parent relation neighbors or vias are not loaded — pan the map to load more OSM data'
    case 'simple_roundabout':
      return 'This roundabout is part of a larger relation — remove it from the relation first'
    case 'too-few-nodes':
      return 'This way needs at least two nodes to split'
    default:
      return null
  }
}

function buildCutMarkers(
  osm: OsmWay,
  nodeCoords: Record<number, [number, number]>,
): WayCutMarkerFeature[] {
  if (!wayHasSplittableInterior(osm)) return []

  return osm.nodes.slice(1, -1).flatMap((nd): WayCutMarkerFeature[] => {
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
}

function wayLineCoords(
  way: OsmWay,
  nodeCoords: Record<number, [number, number]>,
): [number, number][] | null {
  const coords = way.nodes.flatMap((nodeId): [number, number][] => {
    const coord = nodeCoords[nodeId]
    if (!coord) return []
    return [[coord[1]!, coord[0]!]]
  })
  return coords.length >= 2 ? coords : null
}

function findNearbyInteriorNode(
  way: OsmWay,
  nodeCoords: Record<number, [number, number]>,
  lngLat: { lng: number; lat: number },
  project: (lngLat: { lng: number; lat: number }) => { x: number; y: number },
): number | null {
  const mousePx = project(lngLat)
  for (const nodeId of way.nodes.slice(1, -1)) {
    const coord = nodeCoords[nodeId]
    if (!coord) continue
    const nodePx = project({ lng: coord[1]!, lat: coord[0]! })
    if (Math.hypot(mousePx.x - nodePx.x, mousePx.y - nodePx.y) <= CUT_PROXIMITY_PX) {
      return nodeId
    }
  }
  return null
}

function projectCutPreview(
  way: OsmWay,
  nodeCoords: Record<number, [number, number]>,
  lngLat: { lng: number; lat: number },
  project: (lngLat: { lng: number; lat: number }) => { x: number; y: number },
): WayCutPreview | null {
  const coords = wayLineCoords(way, nodeCoords)
  if (!coords) return null

  const nearest = nearestPointOnLine(lineString(coords), point([lngLat.lng, lngLat.lat]))
  const [lng, lat] = nearest.geometry.coordinates as [number, number]
  const mousePx = project(lngLat)
  const nearestPx = project({ lng, lat })
  const distPx = Math.hypot(mousePx.x - nearestPx.x, mousePx.y - nearestPx.y)
  if (distPx > CUT_PROXIMITY_PX) return null

  const segmentIndex = nearest.properties.index ?? 0
  return { lng, lat, segmentIndex }
}

type CutTarget = { kind: 'node'; nodeId: number } | { kind: 'preview'; preview: WayCutPreview }

function resolveCutTarget(
  way: OsmWay,
  nodeCoords: Record<number, [number, number]>,
  lngLat: { lng: number; lat: number },
  project: (lngLat: { lng: number; lat: number }) => { x: number; y: number },
): CutTarget | null {
  const nearbyNodeId = findNearbyInteriorNode(way, nodeCoords, lngLat, project)
  if (nearbyNodeId != null) {
    return { kind: 'node', nodeId: nearbyNodeId }
  }

  const preview = projectCutPreview(way, nodeCoords, lngLat, project)
  if (!preview) return null
  return { kind: 'preview', preview }
}

export type CutMouseMoveResult = {
  nearCutTarget: boolean
}

export function useWayCutHandler() {
  const queryClient = useQueryClient()
  const authState = useAuthState()
  const { data: graph } = useOsmCoverageQuery({ select: (data) => data.graph })
  const isCutActive = useIsCutActive()
  const preview = useWayCutPreview()
  const selectedOsmRef = useSelectedOsmRef()
  const { activateCut, cancelCut, setHoveredNodeId, setPreview } = useWayCutActions()
  const { updateFeatureRef } = useFeatureSelectionActions()
  const newWayIdRef = useRef(-1)
  const newNodeIdRef = useRef(-1)

  const activateCutForWay = useCallback(
    (osm: OsmWay) => {
      if (authState !== AuthState.success) return
      if (graph && assessWaySplitRegardingRelations(graph, osm.id) !== 'ok') return
      if (!wayCanSplit(osm)) return

      const markers = buildCutMarkers(osm, graph?.nodeCoords ?? {})
      activateCut({ type: 'FeatureCollection', features: markers })
    },
    [activateCut, authState, graph],
  )

  const commitSplit = useCallback(
    (wayId: number, result: CutOsmWayResult, original: OsmWay | null) => {
      recordEditingImagery()
      if (result.newNode) {
        addChangedNode(result.newNode)
      }
      addChangedEntity(result.newWay, { source: 'split' })
      addChangedEntity(result.oldWay, { original, source: 'split' })

      const graphRelations = graph?.relations ?? {}
      for (const relation of result.modifiedRelations) {
        addChangedRelation(relation, {
          original: graphRelations[relation.id] ?? null,
        })
      }

      if (selectedOsmRef?.type === 'way' && selectedOsmRef.id === wayId) {
        updateFeatureRef({ type: 'way', id: result.oldWay.id })
      }

      cancelCut()
    },
    [cancelCut, graph?.relations, selectedOsmRef, updateFeatureRef],
  )

  const handleCutMarkerClick = useCallback(
    (event: MapLayerMouseEvent) => {
      if (authState !== AuthState.success) return false

      const markerFeature = event.features?.find(
        (feature) => feature.layer?.id === WAY_CUT_MARKERS_HITAREA_LAYER_ID,
      )
      const nodeId = markerFeature?.properties?.nodeId as number | undefined
      const wayId = markerFeature?.properties?.wayId as number | undefined
      if (!nodeId || !wayId) return false

      const original = getOsmWayFromSession(queryClient, wayId)
      const result = cutOsmWayInSession(queryClient, wayId, nodeId, newWayIdRef.current--)
      if (!result) return false

      commitSplit(wayId, result, original)
      event.originalEvent.stopPropagation()
      return true
    },
    [authState, commitSplit, queryClient],
  )

  const splitAtPreview = useCallback(
    (wayId: number, cutPreview: WayCutPreview, event: MapLayerMouseEvent) => {
      const original = getOsmWayFromSession(queryClient, wayId)
      const result = insertNodeAndCutOsmWayInSession(
        queryClient,
        wayId,
        cutPreview.segmentIndex,
        { lat: cutPreview.lat, lon: cutPreview.lng },
        newNodeIdRef.current--,
        newWayIdRef.current--,
      )
      if (!result) return false

      commitSplit(wayId, result, original)
      event.originalEvent.stopPropagation()
      return true
    },
    [commitSplit, queryClient],
  )

  const handleCutPreviewClick = useCallback(
    (event: MapLayerMouseEvent) => {
      if (authState !== AuthState.success || !preview || !selectedOsmRef) return false
      if (selectedOsmRef.type !== 'way') return false
      return splitAtPreview(selectedOsmRef.id, preview, event)
    },
    [authState, preview, selectedOsmRef, splitAtPreview],
  )

  const handleCutMapClick = useCallback(
    (event: MapLayerMouseEvent) => {
      if (!isCutActive || !selectedOsmRef || selectedOsmRef.type !== 'way') return false
      if (preview) return splitAtPreview(selectedOsmRef.id, preview, event)

      const way = graph?.ways[selectedOsmRef.id]
      if (!way) return false

      const map = event.target
      const target = resolveCutTarget(
        way,
        graph?.nodeCoords ?? {},
        { lng: event.lngLat.lng, lat: event.lngLat.lat },
        (lngLat) => map.project([lngLat.lng, lngLat.lat]),
      )
      if (!target) return false

      if (target.kind === 'node') {
        const original = getOsmWayFromSession(queryClient, selectedOsmRef.id)
        const result = cutOsmWayInSession(
          queryClient,
          selectedOsmRef.id,
          target.nodeId,
          newWayIdRef.current--,
        )
        if (!result) return false

        commitSplit(selectedOsmRef.id, result, original)
        event.originalEvent.stopPropagation()
        return true
      }

      return splitAtPreview(selectedOsmRef.id, target.preview, event)
    },
    [
      commitSplit,
      graph?.nodeCoords,
      graph?.ways,
      isCutActive,
      preview,
      queryClient,
      selectedOsmRef,
      splitAtPreview,
    ],
  )

  const handleCutClick = useCallback(
    (event: MapLayerMouseEvent) => {
      const markerFeature = event.features?.find(
        (feature) => feature.layer?.id === WAY_CUT_MARKERS_HITAREA_LAYER_ID,
      )
      if (markerFeature) {
        return handleCutMarkerClick(event)
      }
      const previewFeature = event.features?.find(
        (feature) => feature.layer?.id === WAY_CUT_PREVIEW_HITAREA_LAYER_ID,
      )
      if (previewFeature) {
        return handleCutPreviewClick(event)
      }
      return handleCutMapClick(event)
    },
    [handleCutMapClick, handleCutMarkerClick, handleCutPreviewClick],
  )

  const clearCutHoverState = useCallback(() => {
    setHoveredNodeId(null)
    setPreview(null)
  }, [setHoveredNodeId, setPreview])

  const handleCutMouseMove = useCallback(
    (event: MapLayerMouseEvent): CutMouseMoveResult | null => {
      if (!isCutActive) return null

      const markerFeature = event.features?.find(
        (feature) => feature.layer?.id === WAY_CUT_MARKERS_HITAREA_LAYER_ID,
      )
      const markerNodeId = markerFeature?.properties?.nodeId as number | undefined
      if (markerNodeId) {
        setHoveredNodeId(markerNodeId)
        setPreview(null)
        return { nearCutTarget: true }
      }

      setHoveredNodeId(null)

      if (!selectedOsmRef || selectedOsmRef.type !== 'way') {
        setPreview(null)
        return { nearCutTarget: false }
      }

      const way = graph?.ways[selectedOsmRef.id]
      if (!way) {
        setPreview(null)
        return { nearCutTarget: false }
      }

      const map = event.target
      const target = resolveCutTarget(
        way,
        graph?.nodeCoords ?? {},
        { lng: event.lngLat.lng, lat: event.lngLat.lat },
        (lngLat) => map.project([lngLat.lng, lngLat.lat]),
      )

      if (target?.kind === 'node') {
        setHoveredNodeId(target.nodeId)
        setPreview(null)
        return { nearCutTarget: true }
      }

      setPreview(target?.preview ?? null)
      return { nearCutTarget: target != null }
    },
    [graph?.nodeCoords, graph?.ways, isCutActive, selectedOsmRef, setHoveredNodeId, setPreview],
  )

  const toggleCutForSelectedWay = useCallback(() => {
    if (isCutActive) {
      cancelCut()
      return
    }
    if (!selectedOsmRef || selectedOsmRef.type !== 'way') return
    const way = graph?.ways[selectedOsmRef.id]
    if (!way) return
    activateCutForWay(way)
  }, [activateCutForWay, cancelCut, graph?.ways, isCutActive, selectedOsmRef])

  return {
    activateCutForWay,
    cancelCut,
    clearCutHoverState,
    handleCutClick,
    handleCutMarkerClick,
    handleCutMouseMove,
    toggleCutForSelectedWay,
    isCutActive,
  }
}
