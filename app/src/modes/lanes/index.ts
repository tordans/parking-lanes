import type { StreetSpaceMode } from '../types'
import { LanesLegendPanel } from './controls/LegendPanel'
import { LanesModeLayers } from './LanesModeLayers'
import { LanesModePanel } from './LanesModePanel'
import { interactiveLayerIds } from './use-lanes-mode-handlers'

export const lanesMode: StreetSpaceMode = {
  id: 'lanes',
  label: 'Lanes',
  enabled: true,
  maturity: 'experimental',
  about: {
    description:
      'Three-column lane editor: select geometry on the map, read the plan sketch in the middle, and edit all lanes in the attribute matrix. Walk the street chain to keep neighbouring segments in view.',
    taggingGuide: {
      label: 'Tagging guide',
      href: 'https://wiki.openstreetmap.org/wiki/Lanes',
    },
  },
  MapLayers: LanesModeLayers,
  Panel: LanesModePanel,
  Legend: LanesLegendPanel,
  interactiveLayerIds,
}

export { useLanesCoveragePace } from './map/use-lanes-coverage-pace'
export { getMapSizePx, toBounds } from '../parking/map/use-parking-map'
export { viewMinZoom } from './map/constants'
