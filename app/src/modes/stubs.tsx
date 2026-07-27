import * as m from '@app/paraglide/messages'
import { getModeLabel, getModeStubAbout } from '../i18n/mode-content'
import type { ModeMapProps, ModePanelProps, StreetSpaceMode, StreetSpaceModeId } from './types'

function StubMapLayers(_props: ModeMapProps) {
  return null
}

function StubPanel(_props: ModePanelProps) {
  return <p className="mt-4 text-sm text-zinc-600">{m.mode_stub_panel()}</p>
}

export function createStubMode(id: StreetSpaceModeId, label: string): StreetSpaceMode {
  const modeLabel = getModeLabel(id)
  return {
    id,
    label,
    enabled: false,
    maturity: 'experimental',
    about: {
      description: getModeStubAbout(modeLabel),
      taggingGuide: {
        label: m.shell_osm_wiki(),
        href: 'https://wiki.openstreetmap.org/wiki/Main_Page',
      },
    },
    MapLayers: StubMapLayers,
    Panel: StubPanel,
    interactiveLayerIds: [],
  }
}
