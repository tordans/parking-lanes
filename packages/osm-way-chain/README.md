# `@osm-editor-kit/osm-way-chain`

> [!NOTE]
> This package is an **alpha** release and still under active development. APIs may change; install with the npm `alpha` dist-tag.

## What it does

- Walk connected highway ways left and right from a center segment
- Rank neighbor candidates (same road kind, name, ref)
- Flag junctions where more than one neighbor is equally good
- Flip geometry and directional tags when a way is digitized the “wrong” way
- Compile and match **app-owned** way-selection policies (Overpass + in-memory tags)
- Adapter for in-memory session data from `@osm-editor-kit/osm-data`

## Usage

```ts
import type { ParsedOsmData } from '@osm-editor-kit/osm-data'
import {
  buildChain,
  buildWaysOverpassQuery,
  createSessionGraphAdapter,
  matchesOsmWaySelectionSegment,
  tag,
  type OsmWaySelectionPolicy,
} from '@osm-editor-kit/osm-way-chain'

/** App-owned contract — which ways to download / chain. Not package defaults. */
const wayPolicy: OsmWaySelectionPolicy = {
  include: [
    { all: [tag.oneOf('highway', ['residential', 'cycleway', 'path', 'footway', 'steps'])] },
  ],
  globalAll: [tag.neq('access', 'private'), tag.neq('access', 'no')],
}

const graph: ParsedOsmData = /* loaded viewport data */
const adapter = createSessionGraphAdapter(graph)

const { chain, pendingJunctions } = await buildChain(adapter, {
  centerWayId: 123456,
  maxPerSide: 5,
  candidateFilter: (candidate, from) =>
    matchesOsmWaySelectionSegment(candidate, wayPolicy) &&
    matchesOsmWaySelectionSegment(from, wayPolicy),
})

// Overpass download for the same policy:
buildWaysOverpassQuery(wayPolicy, '52.5,13.4,52.51,13.41')
```

Implement `OsmDataAdapter` (`getWay`, `getWaysForNode`) for other data sources. Use `extendChainAtJunction` and `recenterChain` to continue after resolving a junction choice.

Legacy `overpassRoadLikeSelector` / `HighwayInclusionStyle` helpers remain as deprecated shims for street-space-editor.
