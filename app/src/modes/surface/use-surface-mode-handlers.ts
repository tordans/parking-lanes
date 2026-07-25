import type { OsmFeatureRef } from '@osm-editor-kit/osm-map-url'
import { useCallback } from 'react'
import type { MapLayerMouseEvent } from 'react-map-gl/maplibre'
import { useFeatureSelection } from '../../shell/map/feature-selection'
import { useOsmChangeHandler } from '../../shell/map/use-osm-change-handler'
import { surfaceInteractiveLayerIds } from './map/SurfaceLayers'

export { surfaceInteractiveLayerIds as interactiveLayerIds }

export function useSurfaceOsmChangeHandler() {
  return useOsmChangeHandler('surface')
}

export function useSurfaceModeHandlers() {
  const { selectFeature, clearSelection } = useFeatureSelection()

  const handleLayerClick = useCallback(
    (event: MapLayerMouseEvent) => {
      const feature = event.features?.[0]
      const osmId = feature?.properties?.osmId as number | undefined
      const osmType = feature?.properties?.osmType as OsmFeatureRef['type'] | undefined
      if (!osmId || !osmType) return

      const kind = feature?.properties?.kind as string | undefined
      if (kind === 'sidepath') {
        const prefix = feature?.properties?.prefix as 'cycleway' | 'sidewalk' | undefined
        const side = feature?.properties?.side as 'left' | 'right' | undefined
        if (!prefix || !side) return
        selectFeature({ type: osmType, id: osmId, prefix, side })
        event.originalEvent.stopPropagation()
        return
      }

      selectFeature({ type: osmType, id: osmId })
      event.originalEvent.stopPropagation()
    },
    [selectFeature],
  )

  const handleMapClick = useCallback(() => {
    clearSelection()
  }, [clearSelection])

  return {
    handleLayerClick,
    handleMapClick,
  }
}
