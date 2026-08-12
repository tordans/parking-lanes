---
"@osm-editor-kit/osm-surface-quality": minor
---

Pending npm alpha packaging (not in the first publish wave). Documents the kit package as it exists today.

Core features to date:
- Sanitize OSM `surface=*` tags (known value transforms, allowed/ignored lists, `DISALLOWED` sentinel for invalid values)
- Classify sett surfaces by `sett:length` thresholds (`mosaic_sett`, `small_sett`, `large_sett`) with size/length round-trip helpers
- Derive `smoothness` from tags with source and confidence metadata (tag → surface → `tracktype` → `mtb:scale` fallback chain)
- Normalize tagged `smoothness=*` values (including legacy aliases like `horrible` → `very_bad`) without derived fallbacks
- Surface-to-smoothness lookup table for suggestion and map paint
- Suggest OSM-safe parent `surface=*` (and optional `sett:length`) for side-attached infrastructure from parent highway tags
