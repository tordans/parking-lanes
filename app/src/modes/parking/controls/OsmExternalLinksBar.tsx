import { overpassDeUrl } from '@osm-editor-kit/osm-coverage'
import {
  handleJosmLinkClick,
  idEditorUrl,
  josmUrl,
  mapillaryUrl,
} from '@osm-editor-kit/osm-editor-links'

export function OsmExternalLinksBar(props: { wayId: number; lat: number; lng: number }) {
  const josmHref = `${josmUrl + overpassDeUrl + getWayWithRelationsOverpassQuery(props.wayId).replace(/\s+/g, ' ')}`

  return (
    <div className="flex items-start justify-between gap-2 text-sm text-zinc-700">
      <span>
        <span>View: </span>
        <a
          href={`https://openstreetmap.org/way/${props.wayId}`}
          target="_blank"
          rel="noreferrer"
          className="text-blue-600 hover:underline"
        >
          OSM
        </a>
        <span>, </span>
        <a
          href={`${mapillaryUrl({ lat: props.lat, lng: props.lng })}`}
          target="_blank"
          rel="noreferrer"
          className="text-blue-600 hover:underline"
        >
          Mapillary
        </a>
      </span>
      <span className="max-sm:hidden">
        <span>Edit: </span>
        <a
          href={josmHref}
          target="_blank"
          rel="noreferrer"
          className="text-blue-600 hover:underline"
          // eslint-disable-next-line @typescript-eslint/no-misused-promises
          onClick={(e) => handleJosmLinkClick(e.nativeEvent)}
        >
          Josm
        </a>
        <span>, </span>
        <a
          href={`${idEditorUrl({ osmObjectType: 'way', osmObjectId: props.wayId })}`}
          target="_blank"
          rel="noreferrer"
          className="text-blue-600 hover:underline"
        >
          iD
        </a>
      </span>
    </div>
  )
}

function getWayWithRelationsOverpassQuery(wayId: number) {
  return `
        [out:xml];
        (
            way(id:${wayId});
            >;
            way(id:${wayId});
            <;
        );
        out meta;`
}
