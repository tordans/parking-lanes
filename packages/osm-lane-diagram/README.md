# `@osm-editor-kit/osm-lane-diagram`

Pure TypeScript layout engine: OSM way tags → extended LTR slot stack → JSON scene → SVG string. Conceptual overview: [docs/lanes-road-space-approach.md](../../docs/lanes-road-space-approach.md).

```text
tags (+ oriented neighbours)
  → buildRoadSpaceSegment()   // parseWayLanes + cycle/sidepath expansion
  → RoadSpaceChain            // prev / current / next
  → layoutRoadSpace()         // metric offsets, continuous kerbs, tapers, forks
  → RoadSpaceScene            // JSON-serializable rects + polylines
  → sceneToSvg()              // deterministic SVG string
```

## Slot ids

| Slot             | Id                                                                          |
| ---------------- | --------------------------------------------------------------------------- |
| Carriageway lane | `way/<id>/lane/<forward\|backward\|both_ways>/<index>`                      |
| Edge / sidepath  | `way/<id>/cycleway\|sidewalk/<left\|right>` (via `formatSidepathFeatureId`) |

Ids are stable across re-layout so highlights survive edits.

## Boundaries

- **No React / JSX** — the app owns the React SVG consumer.
- **No I/O** — no OSM fetch, stores, router, or app imports.
- **Clear widths only** — layout never adds paint/marking millimetres to slot metres; separator strokes are cosmetic.

Width semantics: [research/width-measurements/README.md](../../research/width-measurements/README.md) §2–4. Pipeline context: [research/lane-rendering/methods-catalogue.md](../../research/lane-rendering/methods-catalogue.md).

Fixtures: import `@osm-editor-kit/osm-lane-diagram/fixtures`.
