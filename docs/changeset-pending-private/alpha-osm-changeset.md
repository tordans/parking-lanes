---
"@osm-editor-kit/osm-changeset": minor
---

Pending npm alpha packaging (not in the first publish wave). Documents the kit package as it exists today.

Core features to date:
- In-memory `ChangesStore` for create/modify buckets across nodes, ways, and relations
- Upsert and remove helpers for changed OSM features, plus a change counter
- Serialize a changes store to `OsmChange` or `.osc` XML via osm-api
- Apply upload results: remap negative IDs to server IDs, update references, and clear the store
- Build changeset tags (`created_by`, `comment`, `host`, `imagery_used`) with optional wiki URL append
- Session-scoped imagery usage tracking and `imagery_used` tag formatting
- Way tag diffing and display-name resolution (`name`, `ref`, or `way id`)
