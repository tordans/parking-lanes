import type { ComponentType } from 'react'

export type StreetSpaceModeId =
  | 'parking'
  | 'width'
  | 'bicycle'
  | 'lanes'
  | 'table'
  | 'surface'
  | 'sidewalks'

export type ModeMaturity = 'alpha' | 'beta' | 'experimental'

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
  maturity: ModeMaturity
  about: ModeAboutContent
  MapLayers: ComponentType<ModeMapProps>
  Panel: ComponentType<ModePanelProps>
  Legend?: ComponentType<{ variant?: 'floating' | 'inline' }>
  /** Optional extra section at the end of the Info panel (e.g. photo credits). */
  InfoExtras?: ComponentType
  interactiveLayerIds: string[]
}
