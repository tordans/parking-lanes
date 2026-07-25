import type { StreetSpaceMode } from '../types'
import { WidthLegendPanel } from './controls/LegendPanel'
import { interactiveLayerIds } from './use-width-mode-handlers'
import { WidthModeLayers } from './WidthModeLayers'
import { WidthModePanel } from './WidthModePanel'

export const widthMode: StreetSpaceMode = {
  id: 'width',
  label: 'Width',
  enabled: true,
  about: {
    description:
      'Inspect and edit highway width in OpenStreetMap. Select a road to view its width and adjust it with draggable side handles.',
    taggingGuide: {
      label: 'Tagging guide',
      href: 'https://wiki.openstreetmap.org/wiki/Key:width',
    },
  },
  MapLayers: WidthModeLayers,
  Panel: WidthModePanel,
  Legend: WidthLegendPanel,
  interactiveLayerIds,
}

export { useWidthCoveragePace } from './map/use-width-coverage-pace'
export { remapWidthOsmWayId } from './map/width-osm-edits'
export { useWidthMapActions } from './map/width-map-store'
export { getMapSizePx, toBounds } from '../parking/map/use-parking-map'
export { viewMinZoom } from './map/constants'
