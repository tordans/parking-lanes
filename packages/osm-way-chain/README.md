# `@osm-editor-kit/osm-way-chain`

> [!NOTE]
> This package is an **alpha** release and still under active development. APIs may change; install with the npm `alpha` dist-tag.

## What it does

- Walk connected highway ways left and right from a center segment
- Rank neighbor candidates (same road kind, name, ref)
- Flag junctions where more than one neighbor is equally good
- Flip geometry and directional tags when a way is digitized the “wrong” way
- Decide which highways count as road-like (for editors and Overpass)
- Adapter for in-memory session data from `@osm-editor-kit/osm-data`

## Usage

```ts
import type { ParsedOsmData } from '@osm-editor-kit/osm-data'
import {
  buildChain,
  createSessionGraphAdapter,
  isEditableRoadLikeSegment,
  overpassRoadLikeSelector,
} from '@osm-editor-kit/osm-way-chain'

const graph: ParsedOsmData = /* loaded viewport data */
const adapter = createSessionGraphAdapter(graph)

const { chain, pendingJunctions } = await buildChain(adapter, {
  centerWayId: 123456,
  maxPerSide: 5,
  candidateFilter: (candidate, from) =>
    isEditableRoadLikeSegment(candidate) && isEditableRoadLikeSegment(from),
})

// chain.segments: predecessors, center, successors (ordered)
// pendingJunctions: nodes where multiple equally good neighbors need a user pick

// Overpass fragment for lane-mode downloads:
overpassRoadLikeSelector('public')
```

Implement `OsmDataAdapter` (`getWay`, `getWaysForNode`) for other data sources. Use `extendChainAtJunction` and `recenterChain` to continue after resolving a junction choice.
