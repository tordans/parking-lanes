import type { StreetSpaceMode } from '../types'
import { SurfaceLegendPanel } from './controls/LegendPanel'
import { SurfaceModeLayers } from './SurfaceModeLayers'
import { SurfaceModePanel } from './SurfaceModePanel'
import { interactiveLayerIds } from './use-surface-mode-handlers'

export const surfaceMode: StreetSpaceMode = {
  id: 'surface',
  label: 'Surface',
  enabled: true,
  maturity: 'alpha',
  about: {
    description:
      'Inspect and edit highway surface and smoothness in OpenStreetMap. Select a way to view tagged coverage and apply surface/smoothness tags.',
    taggingGuide: {
      label: 'Tagging guide',
      href: 'https://wiki.openstreetmap.org/wiki/Key:surface',
    },
  },
  MapLayers: SurfaceModeLayers,
  Panel: SurfaceModePanel,
  Legend: SurfaceLegendPanel,
  interactiveLayerIds,
}
