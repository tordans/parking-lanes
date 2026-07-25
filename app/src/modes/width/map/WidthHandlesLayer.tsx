import { Layer, Source } from 'react-map-gl/maplibre'
import type { HandleGeometry } from '../domain/handle-geometry'
import {
  handleCuePaint,
  handleFillPaint,
  handleHitAreaPaint,
  handleStrokePaint,
  widthLineLayout,
} from './width-layer-paint'

export function WidthHandlesLayer({ handles }: { handles: HandleGeometry | null }) {
  if (!handles) return null

  return (
    <>
      <Source id="width-handles-fill-source" type="geojson" data={handles.rectangles}>
        <Layer id="width-handles-fill-layer" type="fill" paint={handleFillPaint} />
      </Source>
      <Source id="width-handles-stroke-source" type="geojson" data={handles.strokes}>
        <Layer
          id="width-handles-stroke-layer"
          type="line"
          paint={handleStrokePaint}
          layout={widthLineLayout}
        />
      </Source>
      <Source id="width-handles-cues-source" type="geojson" data={handles.cues}>
        <Layer id="width-handles-cues-layer" type="circle" paint={handleCuePaint} />
      </Source>
      <Source id="width-handles-hitarea-source" type="geojson" data={handles.hitAreas}>
        <Layer
          id="width-handles-hitarea-layer"
          type="line"
          paint={handleHitAreaPaint}
          layout={widthLineLayout}
        />
      </Source>
    </>
  )
}
