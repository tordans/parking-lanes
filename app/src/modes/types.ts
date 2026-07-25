import type { ComponentType } from 'react'

export type StreetSpaceModeId = 'parking' | 'width' | 'lanes' | 'surface' | 'sidewalks'

export type ModeMapProps = Record<string, never>

export type ModePanelProps = Record<string, never>

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
