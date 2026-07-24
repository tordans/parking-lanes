import type { MapBounds } from '@osm-editor-kit/osm-data'
import { osmDevUrl, osmProdUrl } from '@osm-editor-kit/osm-editor-links'

export function getUrl(bounds: MapBounds, useDevServer: boolean): string {
  const bbox = [bounds.west, bounds.south, bounds.east, bounds.north].join(',')
  return (useDevServer ? osmDevUrl : osmProdUrl) + '/api/0.6/map?bbox=' + bbox
}
