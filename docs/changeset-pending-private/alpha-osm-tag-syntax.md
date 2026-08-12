---
"@osm-editor-kit/osm-tag-syntax": minor
---

Pending npm alpha packaging (not in the first publish wave). Documents the kit package as it exists today.

Core features to date:
- Parse OSM conditional tag values (`value @ (condition); …`) into value/condition pairs with bracket-aware semicolon splitting
- Format, rebuild, and parse conditional tags for edit UIs (`formatConditionalValue`, `buildConditionalTagValue`, `parseConditionalTagForEdit`)
- Parse opening-hours tag values via `opening_hours`, including odd/even day patterns (`1-31/2`, `2-30/2`)
- Opening-hours diagnostics (structured warnings, parse errors) and open/closed state at a timestamp
