import type { FeatureCollection, MultiPolygon, Polygon } from 'geojson'
import { Layer, Source } from 'react-map-gl/maplibre'
import { coverageOutlinePaint } from './coverage-layer-paint'

export function CoverageOutlineSource({
  collection,
}: {
  collection: FeatureCollection<Polygon | MultiPolygon>
}) {
  if (!collection.features.length) return null

  return (
    <Source id="coverage-debug-coverage-source" type="geojson" data={collection}>
      <Layer id="coverage-debug-coverage-line" type="line" paint={coverageOutlinePaint} />
    </Source>
  )
}
