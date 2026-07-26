import { useCallback } from 'react'
import { useMap } from 'react-map-gl/maplibre'
import { MAIN_MAP_ID } from '../../shell/map/map-ids'
import { useMapLoaded } from '../../shell/map/map-store'
import { useLanesOsmQuery } from './map/lanes-osm-query'

function wayLngLatBounds(
  way: { nodes: number[] },
  nodeCoords: Record<number, [number, number]>,
): [[number, number], [number, number]] | null {
  let minLng = Infinity
  let minLat = Infinity
  let maxLng = -Infinity
  let maxLat = -Infinity
  let found = false

  for (const nodeId of way.nodes) {
    const coord = nodeCoords[nodeId]
    if (!coord) continue
    const [lat, lon] = coord
    minLat = Math.min(minLat, lat)
    maxLat = Math.max(maxLat, lat)
    minLng = Math.min(minLng, lon)
    maxLng = Math.max(maxLng, lon)
    found = true
  }

  if (!found) return null
  return [
    [minLng, minLat],
    [maxLng, maxLat],
  ]
}

export function useLanesFlyToWay() {
  const maps = useMap()
  const map = maps[MAIN_MAP_ID]
  const mapLoaded = useMapLoaded()
  const { data: graph } = useLanesOsmQuery({ select: (data) => data.graph })

  const flyToWay = useCallback(
    (wayId: number) => {
      if (!mapLoaded || !map || !graph) return
      const way = graph.ways[wayId]
      if (!way) return

      const bounds = wayLngLatBounds(way, graph.nodeCoords)
      if (!bounds) return

      map.fitBounds(bounds, {
        padding: { top: 80, bottom: 200, left: 80, right: 80 },
        maxZoom: 18,
        duration: 700,
      })
    },
    [graph, map, mapLoaded],
  )

  return flyToWay
}
