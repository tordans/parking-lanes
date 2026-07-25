import { overpassDeUrl } from '@osm-editor-kit/osm-coverage'
import { handleJosmLinkClick, idEditorUrl, josmUrl } from '@osm-editor-kit/osm-editor-links'
import type { ModeAboutContent } from '../../modes/types'
import { useMapBounds } from '../app-store'
import { useMapViewport } from '../map/map-viewport'
import { PanelSectionDivider } from './PanelSectionDivider'

type Props = {
  about: ModeAboutContent
}

export function AppAboutContent({ about }: Props) {
  const mapBounds = useMapBounds()
  const mapViewport = useMapViewport()

  const linkClass = 'text-blue-600 hover:underline'

  return (
    <div className="flex flex-col text-sm">
      <section className="pb-4">
        <h3 className="mb-1 font-semibold text-zinc-900">About</h3>
        <p className="text-zinc-700">{about.description}</p>
      </section>

      <PanelSectionDivider />

      <section className="flex flex-col gap-2 py-4">
        <h3 className="font-semibold text-zinc-900">Links</h3>
        <div className="flex flex-col gap-1.5">
          <a href={about.taggingGuide.href} target="_blank" rel="noreferrer" className={linkClass}>
            {about.taggingGuide.label}
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
