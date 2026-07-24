import type { MapBounds } from '@osm-editor-kit/osm-data'
import { osmDevUrl, osmProdUrl } from '@osm-editor-kit/osm-editor-links'
import {
  boundsToOverpassBbox,
  buildOverpassInterpreterUrl,
  OsmDataSource,
  overpassDeUrl,
  overpassVkUrl,
} from '@osm-editor-kit/osm-coverage'

export function getUrl(
  bounds: MapBounds,
  editorMode: boolean,
  useDevServer: boolean,
  source: OsmDataSource,
): string {
  if (editorMode || useDevServer || source === OsmDataSource.OsmOrg) {
    const bbox = [bounds.west, bounds.south, bounds.east, bounds.north].join(',')
    return (useDevServer ? osmDevUrl : osmProdUrl) + '/api/0.6/map?bbox=' + bbox
  }

  const overpassUrl = source === OsmDataSource.OverpassDe ? overpassDeUrl : overpassVkUrl
  const overpassQuery = getOverpassViewerQuery(bounds).replace(/\s+/g, ' ')
  return buildOverpassInterpreterUrl(overpassUrl, overpassQuery)
}

function getOverpassViewerQuery(bounds: MapBounds) {
  const bbox = boundsToOverpassBbox(bounds)
  return `
        [out:json];
        (
            way[highway][~"^parking:.*"~"."](${bbox});
            way[amenity=parking](${bbox});
            relation[amenity=parking](${bbox});
        )->.a;
        (
            .a;
            .a >;
            .a <;
            node[amenity=parking](${bbox});
            node[amenity=parking_entrance](${bbox});
        );
        out meta;`
}
