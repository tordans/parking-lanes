import {
  getLayerHydrated,
  getRasterLayerSpec,
  getRasterSourceSpec,
  type EliLayer,
} from '@osm-editor-kit/maplibre-editor-layer-index/react'
import { MAP_CUSTOM_CONTENT_ANCHOR_LAYER_ID } from '@osm-editor-kit/osm-maplibre'
import { useEffect, useState } from 'react'
import { Layer, Source } from 'react-map-gl/maplibre'
import { useBackgroundLayerId } from './use-background-layer'

const BACKGROUND_SOURCE_ID = 'eli-background'
const BACKGROUND_LAYER_ID = 'eli-background'

/** Drop style-layer maxzoom so MapLibre overzooms past ELI native tile zooms instead of hiding. */
function rasterLayerPropsWithoutMaxzoom(layer: EliLayer) {
  const { maxzoom: _maxzoom, ...rest } = getRasterLayerSpec(layer, {
    id: BACKGROUND_LAYER_ID,
    source: BACKGROUND_SOURCE_ID,
    paint: { 'raster-opacity': 1 },
  })
  return rest
}

/**
 * Optional ELI raster imagery above the default map style and below mode layers.
 * Does not change react-map-gl `mapStyle` — only adds a pixel overlay when selected.
 * The invisible stacking anchor is baked into the Positron style.
 */
export function MapBackgroundLayerSource() {
  const backgroundLayerId = useBackgroundLayerId()
  const [resolved, setResolved] = useState<{ id: string; layer: EliLayer } | null>(null)

  useEffect(
    function hydrateSelectedBackgroundLayer() {
      if (backgroundLayerId == null) return

      let cancelled = false
      void getLayerHydrated(backgroundLayerId).then((hydrated) => {
        if (cancelled || hydrated == null) return
        setResolved({ id: backgroundLayerId, layer: hydrated })
      })
      return () => {
        cancelled = true
      }
    },
    [backgroundLayerId],
  )

  const layer =
    backgroundLayerId != null && resolved?.id === backgroundLayerId ? resolved.layer : null

  if (layer == null) return null

  return (
    <>
      <Source id={BACKGROUND_SOURCE_ID} {...getRasterSourceSpec(layer)} />
      <Layer
        {...rasterLayerPropsWithoutMaxzoom(layer)}
        beforeId={MAP_CUSTOM_CONTENT_ANCHOR_LAYER_ID}
      />
    </>
  )
}
