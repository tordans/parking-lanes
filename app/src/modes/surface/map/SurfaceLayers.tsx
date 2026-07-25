import type { OsmFeatureRef } from '@osm-editor-kit/osm-map-url'
import { useMapFocus } from '../../../shell/map/use-map-focus'
import type { SurfaceFeatureCollection } from './parse-highways'
import { SurfaceHighwaysBandSource } from './SurfaceHighwaysBandSource'

type Props = {
  features: SurfaceFeatureCollection
  selectedRef: OsmFeatureRef | null
}

export function SurfaceLayers({ features, selectedRef }: Props) {
  const { focus } = useMapFocus()

  return <SurfaceHighwaysBandSource features={features} selectedRef={selectedRef} focus={focus} />
}

export const surfaceInteractiveLayerIds = [
  'surface-highways-hitarea-layer',
  'surface-sidepaths-hitarea-layer',
]
