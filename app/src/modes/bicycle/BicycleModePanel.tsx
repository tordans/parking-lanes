import * as m from '@app/paraglide/messages'
import type { OsmFeatureRef } from '@osm-editor-kit/osm-map-url'
import { AuthState, useAuthState } from '../../shell/app-store'
import {
  MapFeatureLoadEmptyState,
  MapFeaturePromptEmptyState,
} from '../../shell/controls/MapFeatureEmptyState'
import { useSelectedOsmRef } from '../../shell/map/feature-selection'
import { useMapViewport } from '../../shell/map/map-viewport'
import { viewMinZoom } from '../parking/map/constants'
import { useOsmAuth } from '../parking/map/use-osm-auth'
import { BicycleModeEditor } from './BicycleModeEditor'
import { useBicycleOsmQuery } from './map/bicycle-osm-query'
import { useBicycleOsmChangeHandler } from './use-bicycle-mode-handlers'

function formatFeatureLabel(ref: OsmFeatureRef): string {
  const suffix = ref.prefix && ref.side ? `/${ref.prefix}/${ref.side}` : ''
  return `${ref.type}/${ref.id}${suffix}`
}

export function BicycleModePanel() {
  const onOsmChange = useBicycleOsmChangeHandler()
  const mapViewport = useMapViewport()
  const selectedOsmRef = useSelectedOsmRef()
  const authState = useAuthState()
  const { login } = useOsmAuth()
  const { data: graph, isFetching } = useBicycleOsmQuery({ select: (data) => data.graph })

  if (!selectedOsmRef) {
    return <MapFeaturePromptEmptyState message={m.empty_click_bicycle()} />
  }

  const selectedWay =
    selectedOsmRef.type === 'way' ? (graph?.ways[selectedOsmRef.id] ?? null) : null

  if (!selectedWay) {
    return (
      <MapFeatureLoadEmptyState
        zoom={mapViewport.zoom}
        minZoom={viewMinZoom}
        isFetching={isFetching}
        featureLabel={formatFeatureLabel(selectedOsmRef)}
      />
    )
  }

  return (
    <BicycleModeEditor
      selectedWay={selectedWay}
      selectedOsmRef={selectedOsmRef}
      readOnly={authState !== AuthState.success}
      onLogin={() => void login()}
      onOsmChange={onOsmChange}
    />
  )
}
