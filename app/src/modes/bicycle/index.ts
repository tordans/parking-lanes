import type { StreetSpaceMode } from '../types'
import { BicycleModeLayers } from './BicycleModeLayers'
import { BicycleModePanel } from './BicycleModePanel'
import { BicycleLegendPanel } from './controls/LegendPanel'
import { interactiveLayerIds } from './use-bicycle-mode-handlers'

export const bicycleMode: StreetSpaceMode = {
  id: 'bicycle',
  label: 'Bicycle',
  enabled: true,
  about: {
    description:
      'Inspect and edit bicycle infrastructure on OpenStreetMap ways. Classify cycleways, apply TILDA-style category suggestions, and edit bike-related tags.',
    taggingGuide: {
      label: 'Tagging guide',
      href: 'https://wiki.openstreetmap.org/wiki/Key:cycleway',
    },
  },
  MapLayers: BicycleModeLayers,
  Panel: BicycleModePanel,
  Legend: BicycleLegendPanel,
  interactiveLayerIds,
}

export { getMapSizePx, toBounds } from '../parking/map/use-parking-map'
export { viewMinZoom } from '../parking/map/constants'
