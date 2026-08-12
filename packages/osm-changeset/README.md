# `@osm-editor-kit/osm-changeset`

**Status:** Private (monorepo-only). Eventual npm alpha planned.

## What it does

In-memory OSM edit staging for web editors: accumulate create/modify buckets for nodes, ways, and relations, serialize to `OsmChange` or `.osc` XML, and reconcile after upload.

- `ChangesStore` with upsert/remove helpers and a change counter
- Serialize a store to `OsmChange` or `.osc` XML via `osm-api`
- `applyUploadResult` remaps negative IDs to server IDs, updates references, and clears the store
- `buildChangesetTags` for `created_by`, `comment`, `host`, and `imagery_used` (optional wiki URL append)
- Session-scoped imagery usage tracking and `imagery_used` tag formatting
- Way tag diffing and display-name resolution (`name`, `ref`, or `way id`)

## Usage

```ts
import {
  createEmptyChangesStore,
  upsertChangedWay,
  countChanges,
  changesStoreToOsmChangeXml,
  applyUploadResult,
  buildChangesetTags,
  createImageryUsageSession,
  diffWayTags,
  wayDisplayName,
} from '@osm-editor-kit/osm-changeset'

const store = createEmptyChangesStore()
upsertChangedWay(store, editedWay)
countChanges(store) // → 1

const imagery = createImageryUsageSession()
imagery.record('Esri World Imagery')

const tags = buildChangesetTags('Parking Lanes', '0.1.0', {
  comment: 'Add cycleway tags',
  imageryUsed: imagery.values(),
})

const osc = changesStoreToOsmChangeXml(store, { tags })
// upload via osm-api, then:
const idMap = applyUploadResult(store, uploadResult)

diffWayTags(originalWay, editedWay) // → [{ key, from, to }, …]
wayDisplayName(editedWay) // → "Main Street" | "B 96" | "way 123"
```
