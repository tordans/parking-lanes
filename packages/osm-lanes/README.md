# `@osm-editor-kit/osm-lanes`

**Status:** Private (monorepo-only). Eventual npm alpha planned.

## What it does

Parse OSM way lane tags into a typed `WayLaneModel` with per-lane `LaneSlot` records (forward, backward, both_ways), then serialize back to OSM tags while preserving unrelated keys. Handles pipe-delimited `*:lanes` tags, lane counts, reverse-oneway remirror, driving-side inference, validation warnings, and width reconciliation helpers.

## Usage

```ts
import { parseWayLanes, serializeWayLanes } from '@osm-editor-kit/osm-lanes'

const tags = {
  highway: 'primary',
  oneway: 'yes',
  lanes: '2',
  'turn:lanes': 'left|through',
}

const model = parseWayLanes(tags)
// model.slots → [{ index: 0, direction: 'forward', turn: 'left', ... }, ...]

const out = serializeWayLanes(model, tags)
// out['turn:lanes'] === 'left|through', out.highway unchanged
```

Tag parsing and serialization only — not a lane editor UI or diagram renderer.
