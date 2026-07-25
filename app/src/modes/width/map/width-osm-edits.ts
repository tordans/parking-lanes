import type { OsmWay } from '@osm-editor-kit/osm-data'
import type { QueryClient } from '@tanstack/react-query'
import { emptyWidthOsmData, widthOsmSessionKey, type WidthOsmQueryData } from './width-osm-query'

const sessionKey = widthOsmSessionKey({})

export function updateWidthOsmWay(queryClient: QueryClient, way: OsmWay) {
  queryClient.setQueryData<WidthOsmQueryData>(sessionKey, (current = emptyWidthOsmData()) => ({
    ...current,
    graph: {
      ...current.graph,
      ways: {
        ...current.graph.ways,
        [way.id]: way,
      },
    },
  }))
}

export function remapWidthOsmWayId(
  queryClient: QueryClient,
  oldId: number,
  newId: number,
): OsmWay | null {
  const current = queryClient.getQueryData<WidthOsmQueryData>(sessionKey) ?? emptyWidthOsmData()
  const oldWay = current.graph.ways[oldId]
  if (!oldWay) return null

  const remappedWay: OsmWay = { ...oldWay, id: newId }
  const { [oldId]: _removed, ...remainingWays } = current.graph.ways

  queryClient.setQueryData<WidthOsmQueryData>(sessionKey, {
    ...current,
    graph: {
      ...current.graph,
      ways: {
        ...remainingWays,
        [newId]: remappedWay,
      },
    },
  })

  return remappedWay
}

export function formatWidthTag(widthM: number): string {
  const rounded = Math.round(widthM * 10) / 10
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)
}

export function stageWidthOnWay(way: OsmWay, widthM: number): OsmWay {
  return {
    ...way,
    tags: {
      ...way.tags,
      width: formatWidthTag(widthM),
      'source:width': 'street-space-editor',
    },
  }
}
