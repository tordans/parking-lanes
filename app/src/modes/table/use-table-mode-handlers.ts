import type { OsmFeatureRef } from '@osm-editor-kit/osm-map-url'
import { useCallback } from 'react'
import type { MapLayerMouseEvent } from 'react-map-gl/maplibre'
import { useFeatureSelectionActions } from '../../shell/map/feature-selection-store'
import { useOsmChangeHandler } from '../../shell/map/use-osm-change-handler'
import { useTableMapActions } from './map/table-map-store'
import { tableInteractiveLayerIds } from './map/TableHighwaysSource'

export { tableInteractiveLayerIds as interactiveLayerIds }

export function useTableOsmChangeHandler() {
  return useOsmChangeHandler('table')
}

export function useTableModeHandlers() {
  const { selectFeature, clearSelection } = useFeatureSelectionActions()
  const { clearTableState } = useTableMapActions()
  const handleOsmChange = useTableOsmChangeHandler()

  const handleLayerClick = useCallback(
    (event: MapLayerMouseEvent) => {
      const feature = event.features?.[0]
      const osmId = feature?.properties?.osmId as number | undefined
      const osmType = feature?.properties?.osmType as OsmFeatureRef['type'] | undefined
      if (!osmId || osmType !== 'way') return

      selectFeature({ type: 'way', id: osmId })
      event.originalEvent.stopPropagation()
    },
    [selectFeature],
  )

  const handleMapClick = useCallback(() => {
    clearSelection()
    clearTableState()
  }, [clearSelection, clearTableState])

  return {
    handleLayerClick,
    handleMapClick,
    handleOsmChange,
  }
}
