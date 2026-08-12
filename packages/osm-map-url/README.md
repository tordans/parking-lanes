# `@osm-editor-kit/osm-map-url`

**Status:** Private in-repo; first npm **alpha** publish wave.

## What it does

Parse and serialize compact map and feature query params for OSM editor URLs: `?map=zoom/lat/lng`, `?f=way/id`, legacy `#map=` hash redirects, TanStack Router search helpers, and a `location` cookie for last map view.

## Usage

```ts
import {
  parseMapParam,
  serializeMapParam,
  parseFeatureParam,
  serializeFeatureParam,
  redirectLegacyMapHash,
  routerSearch,
  getLocationFromCookie,
  setLocationToCookie,
} from '@osm-editor-kit/osm-map-url'

parseMapParam('16/52.4751/13.4435') // → { zoom: 16, lat: 52.4751, lng: 13.4435 }
serializeMapParam({ zoom: 16, lat: 52.4751, lng: 13.4435 }) // → "16/52.4751/13.4435"

parseFeatureParam('way/123') // → { type: 'way', id: 123 }
parseFeatureParam('way/123/cycleway/left') // sidepath ref

redirectLegacyMapHash('#map=16/52.4751/13.4435') // → ?map=16/52.4751/13.4435

// TanStack Router: keep slash form in the URL bar, not JSON objects
routerSearch.parse('?map=16/52.4751/13.4435&f=way/123')
routerSearch.stringify({ map: { zoom: 16, lat: 52.4751, lng: 13.4435 }, f: { type: 'way', id: 123 } })
```

`@tanstack/react-router` is a peer dependency (used by `routerSearch` only).
