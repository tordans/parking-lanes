# `@osm-editor-kit/osm-coverage`

**Status:** Private in-repo; first npm **alpha** publish wave.

## What it does

TanStack Query–backed OSM viewport coverage for map editors: incremental downloads, merged `ParsedOsmData` graphs, coverage polygons, and fetch-history GeoJSON. Includes zoom-aware missing-area detection (`computeMissingFetchRequests`, `unionIntoCoverage`), Overpass URL helpers (`boundsToOverpassBbox`, `buildOverpassInterpreterUrl`, `overpassDeUrl`, `overpassVkUrl`), and an `OsmDataSource` enum for download backends.

The `@osm-editor-kit/osm-coverage/dev-osm-map-fixture` subpath is **editor-dev only** — local OSM Map API fixture handler, bbox filtering, and fixture index loader.

## Usage

```ts
import { QueryClient } from '@tanstack/react-query'
import { createOsmCoverageApi, OsmDataSource } from '@osm-editor-kit/osm-coverage'

const api = createOsmCoverageApi<{ source: OsmDataSource }>({
  getSessionKey: ({ source }) => ['osm', source] as const,
  minZoom: 14,
  getDownloadUrl: (bounds, { source }) =>
  /* build Overpass or Map API URL */ '',
})

const queryClient = new QueryClient()
const params = { source: OsmDataSource.OverpassVk }

await api.ensureCoverage(queryClient, {
  bounds: { south: 52.47, west: 13.44, north: 52.48, east: 13.45 },
  zoom: 18,
  mapSizePx: { width: 1024, height: 768 },
  ...params,
})

const data = queryClient.getQueryData(api.sessionKey(params))
// { graph, coverage, fetchHistory }
```
