# `@osm-editor-kit/osm-way-chain`

**Status:** Private in-repo; first npm **alpha** publish wave.

## What it does

Bidirectional OSM way-chain traversal for lane editors: walk connected highway ways from a center segment, score neighbor candidates (same kind, name, ref), surface ambiguous junctions, and orient geometry plus directional tags when a way is reversed.

Includes `mirrorTags` for flipping digitization direction (left/right, forward/backward, oneway, lane pipes, placement), road-like highway predicates (`public` vs `inclusive` inclusion style, Overpass selectors), and a session adapter over in-memory `ParsedOsmData` from `@osm-editor-kit/osm-data`.

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
