import { useSearch } from '@tanstack/react-router'
import { useState } from 'react'
import type { MapLayerMouseEvent } from 'react-map-gl/maplibre'
import { coverageDebugFetchFillLayerId, CoverageDebugLayers } from './CoverageDebugLayers'

export type CoverageHoverInfo = {
  fetchedAt: string
  kind: string
  requestIndex: number
  requestCount: number
  groupId: string
}

export function useCoverageDebugHover() {
  const { debug } = useSearch({ from: '/$mode' })
  const [hoveredGroupId, setHoveredGroupId] = useState<string | null>(null)
  const [coverageHoverInfo, setCoverageHoverInfo] = useState<CoverageHoverInfo | null>(null)

  function handleMouseMove(event: MapLayerMouseEvent) {
    if (!debug) {
      setHoveredGroupId(null)
      setCoverageHoverInfo(null)
      return
    }

    const debugFeature = event.features?.find(
      (feature) => feature.layer?.id === coverageDebugFetchFillLayerId,
    )
    const props = debugFeature?.properties as
      | {
          groupId?: string
          fetchedAt?: string
          kind?: string
          requestIndex?: number
          requestCount?: number
        }
      | undefined

    if (!props?.groupId) {
      setHoveredGroupId(null)
      setCoverageHoverInfo(null)
      return
    }

    setHoveredGroupId(props.groupId)
    setCoverageHoverInfo({
      groupId: props.groupId,
      fetchedAt: props.fetchedAt ?? '',
      kind: props.kind ?? '',
      requestIndex: props.requestIndex ?? 0,
      requestCount: props.requestCount ?? 0,
    })
  }

  function clearHover() {
    setHoveredGroupId(null)
    setCoverageHoverInfo(null)
  }

  return { debug, hoveredGroupId, coverageHoverInfo, handleMouseMove, clearHover }
}

export function CoverageDebugMapLayers({ hoveredGroupId }: { hoveredGroupId: string | null }) {
  const { debug } = useSearch({ from: '/$mode' })
  if (!debug) return null
  return <CoverageDebugLayers hoveredGroupId={hoveredGroupId} />
}

export function CoverageDebugTooltip({ info }: { info: CoverageHoverInfo | null }) {
  const { debug } = useSearch({ from: '/$mode' })
  if (!debug || !info) return null

  return (
    <div className="max-w-xs rounded-lg bg-white/90 px-2 py-1.5 text-xs shadow-xs ring-1 ring-zinc-950/5 backdrop-blur-sm">
      <div className="font-medium text-zinc-900">Coverage fetch</div>
      <div className="mt-1 space-y-0.5 text-zinc-700">
        <div>Fetched: {info.fetchedAt}</div>
        <div>Kind: {info.kind}</div>
        <div>
          Request: {info.requestIndex + 1}/{info.requestCount}
        </div>
        <div className="truncate text-zinc-500">Group: {info.groupId}</div>
      </div>
    </div>
  )
}
