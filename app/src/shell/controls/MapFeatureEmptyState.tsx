import * as m from '@app/paraglide/messages'
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
        <p className="m-0">{m.empty_zoom_feature()}</p>
      ) : props.isFetching ? (
        <p className="m-0">{m.empty_loading_feature()}</p>
      ) : (
        <p className="m-0">{m.empty_feature_not_loaded({ featureLabel: props.featureLabel })}</p>
      )}
    </MapFeatureEmptyState>
  )
}
