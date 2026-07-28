import { Layer, Source } from 'react-map-gl/maplibre'
import {
  MissingDataCenterlineSource,
  missingDataHitAreaLayerId,
} from '../../../shell/map/MissingDataCenterlineSource'
import { SelectedWayCenterlineSource } from '../../../shell/map/SelectedWayCenterlineSource'
import {
  lanesBandPaint,
  lanesHitAreaPaint,
  lanesLineLayout,
  lanesNeighborPaint,
  lanesNextNeighborColor,
  lanesPrevNeighborColor,
} from './lanes-layer-paint'
import type { LanesFeatureCollection } from './parse-highways'

export const lanesMissingLayerIdPrefix = 'lanes-missing'
export const lanesMissingHitAreaLayerId = missingDataHitAreaLayerId(lanesMissingLayerIdPrefix)

function splitFeatures(
  features: LanesFeatureCollection,
  selectedWayId: number | null,
  prevWayId: number | null,
  nextWayId: number | null,
) {
  const base: LanesFeatureCollection = { type: 'FeatureCollection', features: [] }
  const missing: LanesFeatureCollection = { type: 'FeatureCollection', features: [] }
  const selected: LanesFeatureCollection = { type: 'FeatureCollection', features: [] }
  const prev: LanesFeatureCollection = { type: 'FeatureCollection', features: [] }
  const next: LanesFeatureCollection = { type: 'FeatureCollection', features: [] }

  for (const feature of features.features) {
    const id = feature.properties.osmId
    if (id === selectedWayId) {
      selected.features.push(feature)
    } else if (id === prevWayId) {
      prev.features.push(feature)
    } else if (id === nextWayId) {
      next.features.push(feature)
    } else if (feature.properties.completeness === 'none') {
      missing.features.push(feature)
    } else {
      base.features.push(feature)
    }
  }

  return { base, missing, selected, prev, next }
}

export function LanesHighwaysSource({
  features,
  selectedWayId,
  prevWayId,
  nextWayId,
}: {
  features: LanesFeatureCollection
  selectedWayId: number | null
  prevWayId: number | null
  nextWayId: number | null
}) {
  const { base, missing, selected, prev, next } = splitFeatures(
    features,
    selectedWayId,
    prevWayId,
    nextWayId,
  )

  return (
    <>
      {base.features.length > 0 ? (
        <Source id="lanes-highways-source" type="geojson" data={base}>
          <Layer
            id="lanes-highways-band-layer"
            type="line"
            paint={lanesBandPaint}
            layout={lanesLineLayout}
          />
          <Layer
            id="lanes-highways-hitarea-layer"
            type="line"
            paint={lanesHitAreaPaint}
            layout={lanesLineLayout}
          />
        </Source>
      ) : null}

      <MissingDataCenterlineSource
        sourceId="lanes-missing-source"
        layerIdPrefix={lanesMissingLayerIdPrefix}
        collection={missing}
        layout={lanesLineLayout}
      />

      {prev.features.length > 0 ? (
        <Source id="lanes-prev-neighbor-source" type="geojson" data={prev}>
          <Layer
            id="lanes-prev-neighbor-layer"
            type="line"
            paint={{ ...lanesNeighborPaint, 'line-color': lanesPrevNeighborColor }}
            layout={lanesLineLayout}
          />
          <Layer
            id="lanes-prev-neighbor-hitarea-layer"
            type="line"
            paint={lanesHitAreaPaint}
            layout={lanesLineLayout}
          />
        </Source>
      ) : null}

      {next.features.length > 0 ? (
        <Source id="lanes-next-neighbor-source" type="geojson" data={next}>
          <Layer
            id="lanes-next-neighbor-layer"
            type="line"
            paint={{ ...lanesNeighborPaint, 'line-color': lanesNextNeighborColor }}
            layout={lanesLineLayout}
          />
          <Layer
            id="lanes-next-neighbor-hitarea-layer"
            type="line"
            paint={lanesHitAreaPaint}
            layout={lanesLineLayout}
          />
        </Source>
      ) : null}

      <SelectedWayCenterlineSource
        sourceId="lanes-selected-centerline-source"
        layerId="lanes-selected-centerline-layer"
        collection={selected}
        layout={lanesLineLayout}
      />
    </>
  )
}

export const lanesInteractiveLayerIds = [
  'lanes-highways-hitarea-layer',
  'lanes-prev-neighbor-hitarea-layer',
  'lanes-next-neighbor-hitarea-layer',
  lanesMissingHitAreaLayerId,
]
