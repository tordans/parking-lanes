import type { ParsedOsmData } from '@osm-editor-kit/osm-data'
import { useQuery } from '@tanstack/react-query'
import type { FeatureCollection, LineString } from 'geojson'
import { buildRouteSnapperGraphBytes } from './build-graph'
import {
  countRoutingNetworkEdges,
  emptyLineCollection,
  routingNetworkGeoJsonFromBytes,
} from './routing-network-geojson'
import { countRoadWays, coverageGraphSignature, parsedOsmWaysToFeatureCollection } from './ways-geojson'

export type RouteSnapperGraphData = {
  graphBytes: Uint8Array | null
  wayCount: number
  edgeCount: number
  overpassWays: FeatureCollection<LineString>
  routingNetwork: FeatureCollection<LineString>
  lastError: string | null
}

export function emptyRouteSnapperGraphData(): RouteSnapperGraphData {
  return {
    graphBytes: null,
    wayCount: 0,
    edgeCount: 0,
    overpassWays: emptyLineCollection(),
    routingNetwork: emptyLineCollection(),
    lastError: null,
  }
}

export type CreateRouteSnapperGraphApiOptions = {
  /** Query key prefix; coverage signature is appended automatically. */
  getGraphKey: () => readonly unknown[]
  /** Latest merged Overpass session graph (grows incrementally). */
  useCoverageGraph: () => ParsedOsmData
}

/**
 * TanStack Query API that rebuilds the route-snapper graph whenever the
 * Overpass coverage graph grows. Full rebuild (WASM has no incremental API).
 */
export function createRouteSnapperGraphApi({
  getGraphKey,
  useCoverageGraph,
}: CreateRouteSnapperGraphApiOptions) {
  function createUseQuery() {
    return function useRouteSnapperGraphQuery() {
      const graph = useCoverageGraph()
      const signature = coverageGraphSignature(graph)
      return useQuery({
        queryKey: [...getGraphKey(), signature],
        queryFn: async (): Promise<RouteSnapperGraphData> => {
          const wayCount = countRoadWays(graph)
          if (wayCount === 0) return emptyRouteSnapperGraphData()

          const overpassWays = parsedOsmWaysToFeatureCollection(graph)

          try {
            const graphBytes = await buildRouteSnapperGraphBytes(graph)
            if (!graphBytes) {
              return {
                ...emptyRouteSnapperGraphData(),
                wayCount,
                overpassWays,
              }
            }

            const routingNetwork = await routingNetworkGeoJsonFromBytes(graphBytes)
            return {
              graphBytes,
              wayCount,
              edgeCount: countRoutingNetworkEdges(routingNetwork),
              overpassWays,
              routingNetwork,
              lastError: null,
            }
          } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Graph build failed'
            console.error('route-snapper graph build failed', error)
            return {
              graphBytes: null,
              wayCount,
              edgeCount: 0,
              overpassWays,
              routingNetwork: emptyLineCollection(),
              lastError: message,
            }
          }
        },
        staleTime: Number.POSITIVE_INFINITY,
        enabled: countRoadWays(graph) > 0,
      })
    }
  }

  return {
    emptyData: emptyRouteSnapperGraphData,
    createUseQuery,
  }
}
