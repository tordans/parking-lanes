import type { MapBounds } from '../parking/map/types'
import { overpassDeUrl, overpassVkUrl, osmDevUrl, osmProdUrl } from '../utils/links'
import { OsmDataSource } from '../utils/types/osm-data'

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
  return overpassUrl + encodeURIComponent(overpassQuery)
}

function getOverpassViewerQuery(bounds: MapBounds) {
  return `
        [out:json];
        (
            way[highway][~"^parking:.*"~"."](${convertBoundsToOverpassBbox(bounds)});
            way[amenity=parking](${convertBoundsToOverpassBbox(bounds)});
            relation[amenity=parking](${convertBoundsToOverpassBbox(bounds)});
        )->.a;
        (
            .a;
            .a >;
            .a <;
            node[amenity=parking](${convertBoundsToOverpassBbox(bounds)});
            node[amenity=parking_entrance](${convertBoundsToOverpassBbox(bounds)});
        );
        out meta;`
}

function convertBoundsToOverpassBbox(bounds: MapBounds) {
  return [bounds.south, bounds.west, bounds.north, bounds.east].join(',')
}
