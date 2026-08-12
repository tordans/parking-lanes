# `@osm-editor-kit/osm-sidepath-tags`

**Status:** Private (monorepo-only). Eventual npm alpha planned.

## What it does

- **`expandSidepaths`** — split way tags into virtual `{ ref, tags }` entries for `cycleway` and `sidewalk` on `left` / `right` (e.g. `cycleway=lane` → two entries with `highway=cycleway`).
- **`nestSideTags`** — apply a side-specific patch as nested keys (`cycleway:left:width`, `source:cycleway:left:width`, `note:cycleway:left`, and arbitrary `prefix:side:*` keys).
- **`formatSidepathFeatureId` / `parseSidepathFeatureId`** — stable feature ids `way/{osmId}/{prefix}/{side}` with validation.
- **Types** — `SidepathRef`, `SidepathPrefix`, `SidepathSide`.

## Usage

```ts
import {
  expandSidepaths,
  nestSideTags,
  formatSidepathFeatureId,
  parseSidepathFeatureId,
} from '@osm-editor-kit/osm-sidepath-tags'

expandSidepaths(42, { highway: 'residential', cycleway: 'lane' })
// → [{ ref: { osmType: 'way', osmId: 42, prefix: 'cycleway', side: 'left' }, tags: { … } }, …]

nestSideTags({ highway: 'residential' }, 'cycleway', 'left', { width: '1.5', cycleway: 'track' })
// → { highway: 'residential', 'cycleway:left': 'track', 'cycleway:left:width': '1.5' }

formatSidepathFeatureId({ osmType: 'way', osmId: 123, prefix: 'cycleway', side: 'left' })
// → 'way/123/cycleway/left'

parseSidepathFeatureId('way/123/cycleway/left') // → SidepathRef | null
```
