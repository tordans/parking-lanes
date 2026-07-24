import { overpassDeUrl } from '@osm-editor-kit/osm-coverage'
import { handleJosmLinkClick, idEditorUrl, josmUrl } from '@osm-editor-kit/osm-editor-links'
import { useState } from 'react'
import { Button } from '../../components/catalyst/button'
import { useOsmAuth } from '../../modes/parking/map/use-osm-auth'
import { AuthState, useAuthState, useMapBounds, useOsmDisplayName } from '../app-store'
import { useMapViewport } from '../map/map-viewport'
import { PanelSectionDivider } from './PanelSectionDivider'

type Props = {
  variant?: 'compact' | 'panel'
}

export function AppAboutContent({ variant = 'panel' }: Props) {
  const [linksShown, setLinksShown] = useState(false)
  const authState = useAuthState()
  const osmDisplayName = useOsmDisplayName()
  const mapBounds = useMapBounds()
  const mapViewport = useMapViewport()
  const { logout } = useOsmAuth()

  const loginLabelColor =
    authState === AuthState.initial
      ? 'text-zinc-950'
      : authState === AuthState.fail
        ? 'text-red-600'
        : 'text-green-600'

  const linkClass = 'text-blue-600 hover:underline'

  if (variant === 'compact') {
    return (
      <div onMouseEnter={() => setLinksShown(true)} onMouseLeave={() => setLinksShown(false)}>
        <span className={linksShown ? '' : 'hidden'}>
          <a
            href="https://wiki.openstreetmap.org/wiki/Street_parking"
            target="_blank"
            rel="noreferrer"
            className={linkClass}
          >
            Tagging
          </a>
          <span> | </span>
          {mapBounds != null ? (
            <>
              <a
                href={idEditorUrl({
                  zoom: mapViewport.zoom,
                  center: { lat: mapViewport.lat, lng: mapViewport.lng },
                })}
                target="_blank"
                rel="noreferrer"
                className={linkClass}
              >
                iD
              </a>
              <span>, </span>
              <a
                href={josmUrl + overpassDeUrl + getHighwaysOverpassQuery(mapBounds)}
                target="_blank"
                rel="noreferrer"
                className={linkClass}
                onClick={(e) => void handleJosmLinkClick(e.nativeEvent)}
              >
                JOSM
              </a>
              <span> </span>
            </>
          ) : null}
        </span>
        {authState === AuthState.success ? (
          <span className={loginLabelColor}>
            <span>{osmDisplayName ?? 'Logged in'}</span>
            <span> | </span>
            <Button plain className="inline! px-0! py-0!" onClick={logout}>
              Log out
            </Button>
          </span>
        ) : null}
        {authState === AuthState.success ? <span> | </span> : null}
        <a
          href="https://github.com/osmberlin/street-parking-editor"
          target="_blank"
          rel="noreferrer"
          className={linkClass}
        >
          GitHub
        </a>
      </div>
    )
  }

  return (
    <div className="flex flex-col text-sm">
      <section className="pb-4">
        <h3 className="mb-1 font-semibold text-zinc-900">About</h3>
        <p className="text-zinc-700">
          Street Space Editor maps and edits on-street parking and related street-space data in
          OpenStreetMap.
        </p>
      </section>

      <PanelSectionDivider />

      <section className="flex flex-col gap-2 py-4">
        <h3 className="font-semibold text-zinc-900">Links</h3>
        <div className="flex flex-col gap-1.5">
          <a
            href="https://wiki.openstreetmap.org/wiki/Street_parking"
            target="_blank"
            rel="noreferrer"
            className={linkClass}
          >
            Tagging guide
          </a>
          {mapBounds != null ? (
            <>
              <a
                href={idEditorUrl({
                  zoom: mapViewport.zoom,
                  center: { lat: mapViewport.lat, lng: mapViewport.lng },
                })}
                target="_blank"
                rel="noreferrer"
                className={linkClass}
              >
                Open viewport in iD
              </a>
              <a
                href={josmUrl + overpassDeUrl + getHighwaysOverpassQuery(mapBounds)}
                target="_blank"
                rel="noreferrer"
                className={linkClass}
                onClick={(e) => void handleJosmLinkClick(e.nativeEvent)}
              >
                Open viewport in JOSM
              </a>
            </>
          ) : null}
          <a
            href="https://github.com/osmberlin/street-parking-editor"
            target="_blank"
            rel="noreferrer"
            className={linkClass}
          >
            GitHub
          </a>
        </div>
      </section>

      {authState === AuthState.success ? (
        <>
          <PanelSectionDivider />
          <section className="pt-4">
            <div className={loginLabelColor}>
              <p className="m-0">Signed in as {osmDisplayName ?? 'OpenStreetMap user'}.</p>
              <Button plain className="mt-2 px-0!" onClick={logout}>
                Log out
              </Button>
            </div>
          </section>
        </>
      ) : null}
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
