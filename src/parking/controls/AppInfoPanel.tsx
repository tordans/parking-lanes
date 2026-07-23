import { useState } from 'react'
import { Checkbox, CheckboxField } from '../../components/catalyst/checkbox'
import { Label } from '../../components/catalyst/fieldset'
import { handleJosmLinkClick } from '../../utils/josm'
import { idEditorUrl, josmUrl, overpassDeUrl } from '../../utils/links'
import { AuthState, useAppActions, useAuthState, useEditorMode, useMapState } from '../app-store'

export function AppInfoPanel() {
  const [editorLinkShown, setEditorLinkShown] = useState(false)
  const editorMode = useEditorMode()
  const { setEditorMode } = useAppActions()
  const authState = useAuthState()
  const mapState = useMapState()

  const editorModeLabelColor =
    authState === AuthState.initial
      ? 'text-zinc-950'
      : authState === AuthState.fail
        ? 'text-red-600'
        : 'text-green-600'

  return (
    <div
      className="rounded-lg bg-white/90 px-2 py-1 text-sm shadow-xs ring-1 ring-zinc-950/5 backdrop-blur-sm"
      onMouseEnter={() => setEditorLinkShown(true)}
      onMouseLeave={() => setEditorLinkShown(false)}
    >
      <span className={editorLinkShown ? '' : 'hidden'}>
        <a
          href="https://wiki.openstreetmap.org/wiki/Street_parking"
          target="_blank"
          rel="noreferrer"
          className="text-blue-600 hover:underline"
        >
          Tagging
        </a>
        <span> | </span>
        {mapState != null && (
          <>
            <a
              href={idEditorUrl({ zoom: mapState.zoom, center: mapState.center })}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 hover:underline"
            >
              iD
            </a>
            <span>, </span>
            <a
              href={josmUrl + overpassDeUrl + getHighwaysOverpassQuery(mapState.bounds)}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 hover:underline"
              onClick={(e) => void handleJosmLinkClick(e.nativeEvent)}
            >
              Josm
            </a>
            <span> </span>
          </>
        )}
      </span>
      <CheckboxField className="inline-grid! grid-cols-[auto_auto]! gap-x-1.5!">
        <Checkbox checked={editorMode} onChange={setEditorMode} className={editorModeLabelColor} />
        <Label className={editorModeLabelColor}>Editor</Label>
      </CheckboxField>
      <span> | </span>
      <a
        href="https://github.com/osmberlin/street-parking-editor"
        target="_blank"
        rel="noreferrer"
        className="text-blue-600 hover:underline"
      >
        GitHub
      </a>
    </div>
  )
}

function getHighwaysOverpassQuery(bounds: {
  south: number
  west: number
  north: number
  east: number
}) {
  const bbox = [bounds.south, bounds.west, bounds.north, bounds.east].join(',')
  const tag =
    'highway~"^motorway|trunk|primary|secondary|tertiary|unclassified|residential|service|living_street"'
  return `
    [out:xml];
(
    way[${tag}](${bbox});
    >;
    way[${tag}](${bbox});
    <;
);
out meta;`
}
