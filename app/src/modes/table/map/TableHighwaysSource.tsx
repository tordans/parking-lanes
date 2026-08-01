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
} from '../../lanes/map/lanes-layer-paint'
import type { LanesFeatureCollection } from '../../lanes/map/parse-highways'

export const tableMissingLayerIdPrefix = 'table-missing'
export const tableMissingHitAreaLayerId = missingDataHitAreaLayerId(tableMissingLayerIdPrefix)

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

export function TableHighwaysSource({
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
        <Source id="table-highways-source" type="geojson" data={base}>
          <Layer
            id="table-highways-band-layer"
            type="line"
            paint={lanesBandPaint}
            layout={lanesLineLayout}
          />
          <Layer
            id="table-highways-hitarea-layer"
            type="line"
            paint={lanesHitAreaPaint}
            layout={lanesLineLayout}
          />
        </Source>
      ) : null}

      <MissingDataCenterlineSource
        sourceId="table-missing-source"
        layerIdPrefix={tableMissingLayerIdPrefix}
        collection={missing}
        layout={lanesLineLayout}
      />

      {prev.features.length > 0 ? (
        <Source id="table-prev-neighbor-source" type="geojson" data={prev}>
          <Layer
            id="table-prev-neighbor-layer"
            type="line"
            paint={{ ...lanesNeighborPaint, 'line-color': lanesPrevNeighborColor }}
            layout={lanesLineLayout}
          />
          <Layer
            id="table-prev-neighbor-hitarea-layer"
            type="line"
            paint={lanesHitAreaPaint}
            layout={lanesLineLayout}
          />
        </Source>
      ) : null}

      {next.features.length > 0 ? (
        <Source id="table-next-neighbor-source" type="geojson" data={next}>
          <Layer
            id="table-next-neighbor-layer"
            type="line"
            paint={{ ...lanesNeighborPaint, 'line-color': lanesNextNeighborColor }}
            layout={lanesLineLayout}
          />
          <Layer
            id="table-next-neighbor-hitarea-layer"
            type="line"
            paint={lanesHitAreaPaint}
            layout={lanesLineLayout}
          />
        </Source>
      ) : null}

      <SelectedWayCenterlineSource
        sourceId="table-selected-centerline-source"
        layerId="table-selected-centerline-layer"
        collection={selected}
        layout={lanesLineLayout}
      />
    </>
  )
}

export const tableInteractiveLayerIds = [
  'table-highways-hitarea-layer',
  'table-prev-neighbor-hitarea-layer',
  'table-next-neighbor-hitarea-layer',
  tableMissingHitAreaLayerId,
]
