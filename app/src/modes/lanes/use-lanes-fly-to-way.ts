import { useEffect, useRef } from 'react'
import { useMap } from 'react-map-gl/maplibre'
import { MAIN_MAP_ID } from '../../shell/map/map-ids'
import { useMapLoaded } from '../../shell/map/map-store'
import { dominantWayBearing } from '../parking/domain/way-side-order'
import { useLanesOsmQuery } from './map/lanes-osm-query'

const CORRIDOR_PITCH = 45
const CORRIDOR_MAX_ZOOM = 18

function normalizeBearing(degrees: number): number {
  const normalized = degrees % 360
  return normalized < 0 ? normalized + 360 : normalized
}

function angularDistance(a: number, b: number): number {
  const delta = Math.abs(normalizeBearing(a) - normalizeBearing(b)) % 360
  return delta > 180 ? 360 - delta : delta
}

/** Prefer the orientation closer to the current bearing to avoid 180° flips. */
export function preferCloserBearing(target: number, current: number): number {
  const a = normalizeBearing(target)
  const b = normalizeBearing(target + 180)
  return angularDistance(current, a) <= angularDistance(current, b) ? a : b
}

function wayCoordinates(
  way: { nodes: number[] },
  nodeCoords: Record<number, [number, number]>,
): [number, number][] {
  const coords: [number, number][] = []
  for (const nodeId of way.nodes) {
    const coord = nodeCoords[nodeId]
    if (!coord) continue
    const [lat, lon] = coord
    coords.push([lon, lat])
  }
  return coords
}

function wayLngLatBounds(
  coordinates: [number, number][],
): [[number, number], [number, number]] | null {
  if (coordinates.length === 0) return null
  let minLng = Infinity
  let minLat = Infinity
  let maxLng = -Infinity
  let maxLat = -Infinity
  for (const [lng, lat] of coordinates) {
    minLng = Math.min(minLng, lng)
    maxLng = Math.max(maxLng, lng)
    minLat = Math.min(minLat, lat)
    maxLat = Math.max(maxLat, lat)
  }
  return [
    [minLng, minLat],
    [maxLng, maxLat],
  ]
}

function easeCorridorCamera(
  map: NonNullable<ReturnType<typeof useMap>[typeof MAIN_MAP_ID]>,
  coordinates: [number, number][],
): boolean {
  const bounds = wayLngLatBounds(coordinates)
  if (!bounds || coordinates.length < 2) return false

  const currentBearing = map.getBearing()
  const dominant = dominantWayBearing(coordinates)
  const bearing = preferCloserBearing(dominant, currentBearing)

  const camera = map.cameraForBounds(bounds, {
    padding: { top: 100, bottom: 100, left: 80, right: 80 },
    maxZoom: CORRIDOR_MAX_ZOOM,
  })
  if (!camera) return false

  // Pitch must be applied after maxPitch is lifted (lanes mode). Prefer the
  // underlying MapLibre map so react-map-gl view-state sync cannot drop pitch.
  const maplibre = map.getMap()
  maplibre.easeTo({
    center: camera.center,
    zoom: camera.zoom,
    bearing,
    pitch: CORRIDOR_PITCH,
    duration: 700,
  })
  return true
}

/**
 * Corridor camera for lanes mode: bearing + pitch once per selection.
 * Manual pan/rotate suppresses further auto-orientation until the next selection.
 */
export function useLanesCorridorCamera(wayId: number | undefined, enabled = true) {
  const maps = useMap()
  const map = maps[MAIN_MAP_ID]
  const mapLoaded = useMapLoaded()
  const { data: graph } = useLanesOsmQuery({ select: (data) => data.graph })
  const orientedForWayId = useRef<number | null>(null)
  const userSuppressed = useRef(false)
  const prevWayId = useRef(wayId)

  useEffect(
    function suppressAutoCameraOnManualGesture() {
      if (!enabled || !mapLoaded || !map) return
      const maplibre = map.getMap()

      function onUserGesture(event: { originalEvent?: Event }) {
        // Programmatic easeTo also fires rotate/pitch events — only suppress for real input.
        if (!event.originalEvent) return
        userSuppressed.current = true
      }

      maplibre.on('dragstart', onUserGesture)
      maplibre.on('rotatestart', onUserGesture)
      maplibre.on('pitchstart', onUserGesture)
      return () => {
        maplibre.off('dragstart', onUserGesture)
        maplibre.off('rotatestart', onUserGesture)
        maplibre.off('pitchstart', onUserGesture)
      }
    },
    [enabled, map, mapLoaded],
  )

  useEffect(
    function resetOrientationWhenDisabled() {
      if (enabled) return
      orientedForWayId.current = null
      userSuppressed.current = false
    },
    [enabled],
  )

  useEffect(
    function orientCameraOnSelectionChange() {
      if (!enabled) return

      if (prevWayId.current !== wayId) {
        userSuppressed.current = false
        prevWayId.current = wayId
      }

      if (wayId == null || !mapLoaded || !map || !graph) return
      if (orientedForWayId.current === wayId) return

      if (userSuppressed.current) {
        orientedForWayId.current = wayId
        return
      }

      const way = graph.ways[wayId]
      if (!way) return

      const coordinates = wayCoordinates(way, graph.nodeCoords)
      if (!easeCorridorCamera(map, coordinates)) return

      orientedForWayId.current = wayId
    },
    [enabled, graph, map, mapLoaded, wayId],
  )
}
