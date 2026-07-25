import type { ReactNode } from 'react'

const emptyStateClassName =
  'flex flex-col items-center justify-center gap-2 px-4 py-12 text-center text-sm text-zinc-600'

export function MapFeatureEmptyState(props: { children: ReactNode }) {
  return <div className={emptyStateClassName}>{props.children}</div>
}

export function MapFeaturePromptEmptyState(props: { message: string }) {
  return (
    <MapFeatureEmptyState>
      <p className="m-0">{props.message}</p>
    </MapFeatureEmptyState>
  )
}

export function MapFeatureLoadEmptyState(props: {
  zoom: number
  minZoom: number
  isFetching: boolean
  featureLabel: string
}) {
  const belowMinZoom = props.zoom < props.minZoom

  return (
    <MapFeatureEmptyState>
      {belowMinZoom ? (
        <p className="m-0">Zoom in to load this feature.</p>
      ) : props.isFetching ? (
        <p className="m-0">Loading feature…</p>
      ) : (
        <p className="m-0">
          Feature {props.featureLabel} is not in the loaded area. Pan the map to load it.
        </p>
      )}
    </MapFeatureEmptyState>
  )
}
