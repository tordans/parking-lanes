# `@osm-editor-kit/osm-route-snapper`

> [!NOTE]
> This package is an **alpha** release and still under active development. APIs may change; install with the npm `alpha` dist-tag.

## What it does

Turn session OSM data (`@osm-editor-kit/osm-data`) into a [route-snapper](https://github.com/a-b-street/route-snapper) graph:

- Build graph bytes from coverage (vendored `osm-to-route-snapper` WASM)
- Export a routing-network GeoJSON (edges split at intersections)
- Export highway ways as GeoJSON LineStrings
- Cache key / signature when coverage changes
- Optional TanStack Query hook that rebuilds the graph as the map downloads more OSM

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
