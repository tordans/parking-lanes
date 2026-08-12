---
"@osm-editor-kit/osm-sidepath-tags": minor
---

Pending npm alpha packaging (not in the first publish wave). Documents the kit package as it exists today.

Core features to date:
- Expand way tags into virtual left/right sidepath entries for `cycleway` and `sidewalk` prefixes via bicycle-infrastructure transformations
- Nest side-specific tag patches under OSM sidepath key conventions (`cycleway:left:width`, `source:cycleway:left:width`, `note:cycleway:left`, and arbitrary nested keys)
- Stable sidepath feature IDs (`way/{osmId}/{prefix}/{side}`) with format/parse helpers and validation
- Shared types for sidepath refs (`SidepathRef`, `SidepathPrefix`, `SidepathSide`)
