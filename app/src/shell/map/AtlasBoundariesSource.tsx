import { Layer, Source } from 'react-map-gl/maplibre'
import {
  ATLAS_BOUNDARIES_SOURCE_ID,
  ATLAS_BOUNDARIES_TILES_URL,
  atlasDistrictFilter,
  atlasDistrictLabelPaint,
  atlasDistrictLinePaint,
  atlasXhainHighlightPaint,
} from './atlas-boundaries-paint'
import { CUSTOM_CONTENT_ANCHOR_LAYER_ID } from './MapBackgroundLayerSource'
import { useMapBoundariesEnabled } from './use-map-boundaries'

/**
 * Berlin/DE admin boundaries from TILDA atlas tiles, stacked above basemap and below mode layers.
 */
export function AtlasBoundariesSource() {
  const enabled = useMapBoundariesEnabled()

  if (!enabled) return null

  return (
    <Source
      id={ATLAS_BOUNDARIES_SOURCE_ID}
      type="vector"
      tiles={[ATLAS_BOUNDARIES_TILES_URL]}
      minzoom={4}
      maxzoom={14}
      promoteId="id"
    >
      <Layer
        id="atlas-district-boundaries"
        type="line"
        source-layer="boundaries"
        filter={atlasDistrictFilter}
        paint={atlasDistrictLinePaint}
        beforeId={CUSTOM_CONTENT_ANCHOR_LAYER_ID}
      />
      <Layer
        id="atlas-xhain-highlight"
        type="line"
        source-layer="boundaries"
        filter={[
          'all',
          ['has', 'category_district'],
          ['==', ['get', 'name'], 'Friedrichshain-Kreuzberg'],
        ]}
        paint={atlasXhainHighlightPaint}
        beforeId={CUSTOM_CONTENT_ANCHOR_LAYER_ID}
      />
      <Layer
        id="atlas-district-labels"
        type="symbol"
        source-layer="boundaryLabels"
        filter={atlasDistrictFilter}
        layout={{
          'text-field': [
            'concat',
            ['to-string', ['get', 'name_prefix']],
            ' ',
            ['to-string', ['get', 'name']],
          ],
          'text-size': 14,
        }}
        paint={atlasDistrictLabelPaint}
        beforeId={CUSTOM_CONTENT_ANCHOR_LAYER_ID}
      />
    </Source>
  )
}
