import type { OsmFeatureRef } from '@osm-editor-kit/osm-map-url'
import { useCallback } from 'react'
import type { MapLayerMouseEvent } from 'react-map-gl/maplibre'
import { useFeatureSelection } from '../../shell/map/feature-selection'
import { useOsmChangeHandler } from '../../shell/map/use-osm-change-handler'
import { bicycleInteractiveLayerIds } from './map/BicycleLayers'
import { bicycleToCollection } from './map/parse-bikelanes'

export { bicycleInteractiveLayerIds as interactiveLayerIds }

export function useBicycleOsmChangeHandler() {
  return useOsmChangeHandler('bicycle')
}

export function useBicycleModeHandlers() {
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

export function selectedBicycleCenterline(
  features: ReturnType<typeof bicycleToCollection>,
  selectedOsmRef: OsmFeatureRef | undefined,
) {
  if (!selectedOsmRef || selectedOsmRef.type !== 'way') {
    return bicycleToCollection([])
  }

  const feature = features.features.find((entry) => {
    if (entry.properties.kind === 'sidepath') {
      return (
        entry.properties.osmId === selectedOsmRef.id &&
        entry.properties.prefix === selectedOsmRef.prefix &&
        entry.properties.side === selectedOsmRef.side
      )
    }

    return (
      entry.properties.osmId === selectedOsmRef.id &&
      selectedOsmRef.prefix == null &&
      selectedOsmRef.side == null
    )
  })

  return feature ? bicycleToCollection([feature]) : bicycleToCollection([])
}
