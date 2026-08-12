# `@osm-editor-kit/osm-coverage`

> [!NOTE]
> This package is an **alpha** release and still under active development. APIs may change; install with the npm `alpha` dist-tag.

## What it does

- Download OSM data for the current map viewport (and only the parts you have not covered yet)
- Keep a session graph of ways/nodes/relations as the map moves and pans
- Track covered areas as polygons so refetches skip what you already have
- Record fetch history as GeoJSON for debugging and UI
- Build Overpass query URLs for common interpreters
- Optional durable session storage (`storage` adapter) for graph + coverage across reloads
- Optional editor-dev fixture loader via `@osm-editor-kit/osm-coverage/dev-osm-map-fixture` (not for production apps; not on the main export)

## Usage

```ts
import { QueryClient } from '@tanstack/react-query'
import { createOsmCoverageApi, OsmDataSource } from '@osm-editor-kit/osm-coverage'

const api = createOsmCoverageApi<{ source: OsmDataSource }>({
  getSessionKey: ({ source }) => ['osm', source] as const,
  minZoom: 14,
  getDownloadUrl: (bounds, { source }) =>
  /* build Overpass or Map API URL */ '',
  // optional: storage: { load, save, clear }
})

const queryClient = new QueryClient()
const params = { source: OsmDataSource.OverpassVk }

await api.restoreSession(queryClient, params)
await api.ensureCoverage(queryClient, {
  bounds: { south: 52.47, west: 13.44, north: 52.48, east: 13.45 },
  zoom: 18,
  mapSizePx: { width: 1024, height: 768 },
  ...params,
})

const data = queryClient.getQueryData(api.sessionKey(params))
// { graph, coverage, fetchHistory, savedAt }
```
