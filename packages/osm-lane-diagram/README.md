# `@osm-editor-kit/osm-lane-diagram`

**Status:** Private (monorepo-only). Eventual npm alpha planned.

## What it does

Pure TypeScript layout engine: OSM way tags → extended LTR slot stack → JSON scene → SVG string. Conceptual overview: [docs/lanes-road-space-approach.md](../../docs/lanes-road-space-approach.md).

## Usage

```text
tags (+ oriented neighbours)
  → buildRoadSpaceSegment()   // parseWayLanes + cycle/sidepath expansion
  → RoadSpaceChain            // prev / current / next
  → layoutRoadSpace()         // metric offsets, tapers, forks
  → RoadSpaceScene            // JSON-serializable rects + polylines
  → sceneToSvg()              // deterministic SVG string
```

```ts
import {
  buildRoadSpaceSegment,
  layoutRoadSpace,
  sceneToSvg,
} from '@osm-editor-kit/osm-lane-diagram'

const segment = buildRoadSpaceSegment(/* way tags, neighbours */)
const scene = layoutRoadSpace({ segments: [chain] })
const svg = sceneToSvg(scene)
```

Fixtures: `import { laneDiagramFixtures } from '@osm-editor-kit/osm-lane-diagram/fixtures'`.

Slot ids are stable across re-layout — carriageway lanes (`way/<id>/lane/…`) and edge/sidepath features (`way/<id>/cycleway|sidewalk/<left|right>`).

No React/JSX and no I/O (no OSM fetch, stores, or app imports). Layout uses clear slot widths only; separator strokes are cosmetic.
