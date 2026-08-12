---
"@osm-editor-kit/osm-lane-diagram": minor
---

Pending npm alpha packaging (not in the first publish wave). Documents the kit package as it exists today.

Core features to date:
- OSM way tags (+ oriented neighbours) → LTR slot stack → JSON `RoadSpaceScene` → deterministic SVG via `buildRoadSpaceSegment`, `layoutRoadSpace`, and `sceneToSvg`
- Lane and on-way cycle/sidepath expansion from tags (`parseWayLanes`, `expandSidepaths`) into carriageway and sidepath slots with clear-width metres only
- Stable slot ids (`way/<id>/lane/...`, edge `cycleway|sidewalk` slots) so highlights survive re-layout
- OSM `placement=*` parsing, SRK default anchors, and centreline offset computation (`parsePlacement`, `resolvePlacement`, `centrelineOffsetM`)
- Prev/current/next `RoadSpaceChain` layout with stack correspondence, chain offset solving, junction bands, and width-change tapers
- Dual-carriageway forks: sibling branch slots, median gaps, dimmed opposite branch, and separately-mapped sidepath hints
- Continuous kerb ribbons and carriageway plates with S-curve morphing between cross-section bands
- Pure TypeScript library — no React/JSX, no OSM fetch or app imports; fixtures export `@osm-editor-kit/osm-lane-diagram/fixtures`
