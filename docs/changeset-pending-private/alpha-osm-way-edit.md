---
"@osm-editor-kit/osm-way-edit": minor
---

Pending npm alpha packaging (not in the first publish wave). Documents the kit package as it exists today.

Core features to date:
- Split a way at an existing interior node (`splitOsmWayAtNode`); predicates for splittable ways and interior nodes
- Insert a new node on a way segment (`insertNodeOnWaySegment`)
- Split a way inside `ParsedOsmData` and rewrite parent relations iD-style (`splitOsmWayAtNodeInGraph`)
- Turn-restriction and destination_sign relations: rewrite from/via/to members when a referenced way is split
- Non-restriction relations: duplicate split way members with connectivity-aware ordering (including roundabout/circular junctions)
- Pre-split relation checks mirroring iD (`assessWaySplitRegardingRelations`: incomplete parents, simple roundabouts)
- Helpers: `parentRelations`, `hasFromViaTo`, `graphHasEntity`
