import type { OsmWay } from '@osm-editor-kit/osm-data'
import type { ComponentType } from 'react'

export type StreetSpaceModeId = 'parking' | 'width' | 'lanes' | 'surface' | 'sidewalks'

export type ModeMapProps = {
  mapZoom: number
}

export type ModePanelProps = {
  onCutLane: (way: OsmWay) => void
  onOsmChange: (way: OsmWay) => void
  onClose: () => void
}

/** Mode owns visualization + edit UI. Auth, fetch, and upload stay in the shell. */
export type StreetSpaceMode = {
  id: StreetSpaceModeId
  label: string
  enabled: boolean
  MapLayers: ComponentType<ModeMapProps>
  Panel: ComponentType<ModePanelProps>
  Legend?: ComponentType
  interactiveLayerIds: string[]
}
