# `@osm-editor-kit/osm-map-url`

> [!NOTE]
> This package is an **alpha** release and still under active development. APIs may change; install with the npm `alpha` dist-tag.

## What it does

- Read and write `?map=zoom/lat/lng` for the map camera
- Read and write `?f=way/id` (and sidepath refs) for the selected feature
- Redirect old `#map=…` hashes to the query-param form
- Helpers for TanStack Router search params (slash form in the URL bar)
- Store / restore the last map view in a `location` cookie

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
routerSearch.stringify({
  map: { zoom: 16, lat: 52.4751, lng: 13.4435 },
  f: { type: 'way', id: 123 },
})
```

`@tanstack/react-router` is a peer dependency (used by `routerSearch` only).
