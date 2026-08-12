# `@osm-editor-kit/osm-way-edit`

**Status:** Private (monorepo-only). Eventual npm alpha planned.

## What it does

Way-splitting primitives for OSM editors, modeled on iD:

- Split a way at an existing interior node (`splitOsmWayAtNode`); predicates for splittable ways and interior nodes
- Insert a new node on a way segment (`insertNodeOnWaySegment`)
- Split inside `ParsedOsmData` and rewrite parent relations (`splitOsmWayAtNodeInGraph`)
- Turn-restriction and `destination_sign` relations: rewrite from/via/to members when a referenced way is split
- Other relations: duplicate split way members with connectivity-aware ordering (including roundabout/circular junctions)
- Pre-split relation checks mirroring iD (`assessWaySplitRegardingRelations`: incomplete parents, simple roundabouts)
- Helpers: `parentRelations`, `hasFromViaTo`, `graphHasEntity`

Depends on `@osm-editor-kit/osm-data` for types and `ParsedOsmData`.

## Usage

```ts
import {
  assessWaySplitRegardingRelations,
  insertNodeOnWaySegment,
  splitOsmWayAtNode,
  splitOsmWayAtNodeInGraph,
} from '@osm-editor-kit/osm-way-edit'

const split = splitOsmWayAtNode(way, nodeId, newWayId)
const inserted = insertNodeOnWaySegment(way, segmentIndex, { lat, lon }, newNodeId)

if (assessWaySplitRegardingRelations(graph, wayId) === 'ok') {
  const result = splitOsmWayAtNodeInGraph(graph, wayId, nodeId, newWayId)
  // result.graph, result.oldWay, result.newWay, result.modifiedRelations
}
```

Pure graph operations — no API upload or changeset handling.
