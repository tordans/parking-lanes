---
"@osm-editor-kit/osm-way-chain": minor
---

Initial npm alpha release.

Core features to date:
- Bidirectional way-chain traversal from a center segment via `OsmDataAdapter`, with per-side limits and optional candidate filters
- Junction handling: score and auto-pick neighbor ways (same kind, name, ref) or surface ambiguous choices for `extendChainAtJunction`
- Segment orientation: flip geometry and normalize directional OSM tags when chaining reversed ways
- `mirrorTags` for reversing way digitization (left/right, forward/backward, oneway, lane pipes, placement, and related keys)
- Road-like highway predicates with `public` vs `inclusive` inclusion style, plus Overpass selectors for lane-mode chains
- Session graph adapter backed by in-memory `ParsedOsmData` (`createSessionGraphAdapter`, `osmWayToSegment`)
