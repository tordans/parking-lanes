import type { OsmWay } from '@osm-editor-kit/osm-data'
import type { ComponentType } from 'react'

export type StreetSpaceModeId = 'parking' | 'width' | 'lanes' | 'surface' | 'sidewalks'

export type ModeMapProps = Record<string, never>

export type ModePanelProps = {
  onCutLane: (way: OsmWay) => void
  onOsmChange: (way: OsmWay) => void
  onClose: () => void
}

export type ModeAboutContent = {
  description: string
  taggingGuide: {
    label: string
    href: string
  }
}

/** Mode owns visualization + edit UI. Auth, fetch, and upload stay in the shell. */
export type StreetSpaceMode = {
  id: StreetSpaceModeId
  label: string
  enabled: boolean
  about: ModeAboutContent
  MapLayers: ComponentType<ModeMapProps>
  Panel: ComponentType<ModePanelProps>
  Legend?: ComponentType<{ variant?: 'floating' | 'inline' }>
  interactiveLayerIds: string[]
}
