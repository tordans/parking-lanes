import type { StreetSpaceMode } from '../types'
import { LanesLegendPanel } from './controls/LegendPanel'
import { LanesBottomPanel } from './LanesBottomPanel'
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
      'Edit lane counts, turn restrictions, and access tags on OpenStreetMap highways. Select a road to view its cross-section and walk along the street chain.',
    taggingGuide: {
      label: 'Tagging guide',
      href: 'https://wiki.openstreetmap.org/wiki/Lanes',
    },
  },
  MapLayers: LanesModeLayers,
  Panel: LanesModePanel,
  BottomPanel: LanesBottomPanel,
  Legend: LanesLegendPanel,
  interactiveLayerIds,
}

export { useLanesCoveragePace } from './map/use-lanes-coverage-pace'
export { getMapSizePx, toBounds } from '../parking/map/use-parking-map'
export { viewMinZoom } from './map/constants'
