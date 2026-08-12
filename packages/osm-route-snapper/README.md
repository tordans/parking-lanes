# `@osm-editor-kit/osm-route-snapper`

**Status:** Private in-repo; first npm **alpha** publish wave.

## What it does

Bridge between merged session `ParsedOsmData` (`@osm-editor-kit/osm-data`) and the [route-snapper](https://github.com/a-b-street/route-snapper) routing graph:

- Build route-snapper **bincode graph bytes** from Overpass/session coverage via vendored `osm-to-route-snapper` WASM
- Serialize parsed OSM to minimal OSM XML for graph conversion
- Extract **routing-network GeoJSON** (intersection-split edges) from graph bytes
- GeoJSON LineStrings for session highway ways and a **coverage graph signature** for cache keys
- TanStack Query factory that rebuilds the graph when Overpass coverage grows

## Usage

```ts
import {
  buildRouteSnapperGraphBytes,
  createRouteSnapperGraphApi,
  parsedOsmWaysToFeatureCollection,
  routingNetworkGeoJsonFromBytes,
} from '@osm-editor-kit/osm-route-snapper'
```

**Direct graph build** — pass merged `ParsedOsmData`; returns `Uint8Array` bincode or `null` when there are no ways:

```ts
const graphBytes = await buildRouteSnapperGraphBytes(parsedOsm)
const routingNetwork = graphBytes
  ? await routingNetworkGeoJsonFromBytes(graphBytes)
  : null
```

**React + TanStack Query** — `createRouteSnapperGraphApi` wires coverage growth to automatic full rebuilds (WASM has no incremental API):

```ts
const { useRouteSnapperGraphQuery } = createRouteSnapperGraphApi({
  getGraphKey: () => ['route-snapper-graph'],
  useCoverageGraph: () => useSessionParsedOsm(),
})
```

**Usage notes**

- Graph conversion uses vendored `osm-to-route-snapper` WASM; routing-network GeoJSON uses the peer **`route-snapper`** package (`^0.4.9`) — install both in the app.
- Peer deps: `react`, `@tanstack/react-query`, `route-snapper`.
