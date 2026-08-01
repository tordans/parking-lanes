import type { StreetSpaceMode } from '../types'
import { TableBottomPanel } from './TableBottomPanel'
import { TableModeLayers } from './TableModeLayers'
import { TableModePanel } from './TableModePanel'
import { interactiveLayerIds } from './use-table-mode-handlers'

export const tableMode: StreetSpaceMode = {
  id: 'table',
  label: 'Table',
  enabled: true,
  maturity: 'experimental',
  about: {
    description:
      'Compare and edit all OSM tags across neighbouring highway segments in a spreadsheet-style matrix. Walk the street chain, propagate values from the center segment, and save through the shared changeset.',
    taggingGuide: {
      label: 'Tagging guide',
      href: 'https://wiki.openstreetmap.org/wiki/Tags',
    },
  },
  MapLayers: TableModeLayers,
  Panel: TableModePanel,
  BottomPanel: TableBottomPanel,
  interactiveLayerIds,
}

export { useTableMapActions } from './map/table-map-store'
