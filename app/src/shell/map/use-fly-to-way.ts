import { useEffect, useRef } from 'react'
import { useMap } from 'react-map-gl/maplibre'
import { MAIN_MAP_ID } from './map-ids'
import { useMapLoaded } from './map-store'
import { useOsmCoverageQuery } from './osm-coverage-query'

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

/**
 * Flat fly-to when the selected highway changes (table mode / chain walk).
 * Does not pitch or rotate — lanes keeps its corridor camera separately.
 */
export function useFlyToWay(wayId: number | undefined, enabled = true) {
  const maps = useMap()
  const map = maps[MAIN_MAP_ID]
  const mapLoaded = useMapLoaded()
  const { data: graph } = useOsmCoverageQuery({ select: (data) => data.graph })
  const flownForWayId = useRef<number | null>(null)

  useEffect(
    function resetWhenDisabled() {
      if (enabled) return
      flownForWayId.current = null
    },
    [enabled],
  )

  useEffect(
    function flyToSelectedWay() {
      if (!enabled || wayId == null || !mapLoaded || !map || !graph) return
      if (flownForWayId.current === wayId) return

      const way = graph.ways[wayId]
      if (!way) return

      const coordinates = wayCoordinates(way, graph.nodeCoords)
      const bounds = wayLngLatBounds(coordinates)
      if (!bounds || coordinates.length < 2) return

      map.fitBounds(bounds, {
        padding: { top: 80, bottom: 80, left: 60, right: 120 },
        maxZoom: 18,
        duration: 600,
      })
      flownForWayId.current = wayId
    },
    [enabled, graph, map, mapLoaded, wayId],
  )
}
