import type { ModeMapProps, ModePanelProps, StreetSpaceMode, StreetSpaceModeId } from './types'

function StubMapLayers(_props: ModeMapProps) {
  return null
}

function StubPanel(_props: ModePanelProps) {
  return (
    <p className="mt-4 text-sm text-zinc-600">
      This mode is not available yet. Parking mode remains fully editable; edits stay in the shared
      changeset.
    </p>
  )
}

export function createStubMode(id: StreetSpaceModeId, label: string): StreetSpaceMode {
  return {
    id,
    label,
    enabled: false,
    about: {
      description: `${label} editing is coming soon.`,
      taggingGuide: {
        label: 'OpenStreetMap wiki',
        href: 'https://wiki.openstreetmap.org/wiki/Main_Page',
      },
    },
    MapLayers: StubMapLayers,
    Panel: StubPanel,
    interactiveLayerIds: [],
  }
}
