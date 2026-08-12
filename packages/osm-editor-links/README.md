# `@osm-editor-kit/osm-editor-links`

**Status:** Private (monorepo-only). Eventual npm alpha planned.

## What it does

Build deep links and host constants for OSM editing workflows: osm.org element and changeset URLs, web editors (iD, Rapid, Kyle Kiwi), JOSM remote control, OSM API map downloads, Mapillary, OSM Deep History, OSMCha, and TILDA inspector URLs. Includes OSM type helpers and a JOSM link-click handler.

## Usage

```ts
import {
  osmOrgUrl,
  osmEditIdUrl,
  josmLoadObjectUrl,
  idEditorUrl,
  getUrl,
  mapillaryUrl,
  osmchaChangesetUrl,
  tildaInspectorUrl,
  handleJosmLinkClick,
  osmProdUrl,
} from '@osm-editor-kit/osm-editor-links'

osmOrgUrl({ osmType: 'way', osmId: 123 }) // → https://www.openstreetmap.org/way/123
osmEditIdUrl({ osmType: 'way', osmId: 123, hashtags: 'TILDA' })

josmLoadObjectUrl({ osmType: 'way', osmId: 123 }) // http://127.0.0.1:8111/load_object?…
idEditorUrl({ center: { lat: 52.47, lng: 13.44 }, zoom: 16 })

getUrl({ west: 13.4, south: 52.4, east: 13.5, north: 52.5 }, false) // OSM API map bbox URL
mapillaryUrl({ lat: 52.47, lng: 13.44 }, { dateFrom: '2024-01-01' })

osmchaChangesetUrl(12345)
tildaInspectorUrl({
  regionSlug: 'radinfra',
  map: { zoom: 16, lat: 52.47, lng: 13.44 },
  features: { sourceId: 'atlas_bikelanes', featureId: 123, coords: [13.44, 52.47] },
})

await handleJosmLinkClick(event) // JOSM remote-control link click
```

Depends on `@osm-editor-kit/osm-data` for shared map bounds and OSM object types.
