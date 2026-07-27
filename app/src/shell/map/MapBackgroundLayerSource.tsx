import {
  getLayerHydrated,
  getRasterLayerSpec,
  getRasterSourceSpec,
  type EliLayer,
} from '@osm-editor-kit/maplibre-editor-layer-index/react'
import type { FeatureCollection } from 'geojson'
import { useEffect, useState } from 'react'
import { Layer, Source } from 'react-map-gl/maplibre'
import { useBackgroundLayerId } from './use-background-layer'

const BACKGROUND_SOURCE_ID = 'eli-background'
const BACKGROUND_LAYER_ID = 'eli-background'

/**
 * Invisible anchor that always sits below mode/debug layers.
 * The optional ELI raster uses `beforeId` so late selection still stacks under app content
 * (MapLibre appends newly added layers on top without `beforeId`).
 */
export const CUSTOM_CONTENT_ANCHOR_SOURCE_ID = 'map-custom-content-anchor'
export const CUSTOM_CONTENT_ANCHOR_LAYER_ID = 'map-custom-content-anchor'

const EMPTY_FEATURE_COLLECTION: FeatureCollection = { type: 'FeatureCollection', features: [] }

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

  return (
    <>
      <Source id={CUSTOM_CONTENT_ANCHOR_SOURCE_ID} type="geojson" data={EMPTY_FEATURE_COLLECTION} />
      <Layer
        id={CUSTOM_CONTENT_ANCHOR_LAYER_ID}
        type="fill"
        source={CUSTOM_CONTENT_ANCHOR_SOURCE_ID}
        layout={{ visibility: 'none' }}
        paint={{ 'fill-opacity': 0 }}
      />
      {layer != null ? (
        <>
          <Source id={BACKGROUND_SOURCE_ID} {...getRasterSourceSpec(layer)} />
          <Layer
            {...rasterLayerPropsWithoutMaxzoom(layer)}
            beforeId={CUSTOM_CONTENT_ANCHOR_LAYER_ID}
          />
        </>
      ) : null}
    </>
  )
}
