# `@osm-editor-kit/osm-surface-quality`

**Status:** Private (monorepo-only). Eventual npm alpha planned.

## What it does

Pure TypeScript helpers for OSM `surface=*` and `smoothness=*` tags — ported from FMC Lua sanitization and smoothness derivation logic.

- **Sanitize** `surface` values: known transforms (e.g. `cobblestone` → `large_sett`), allowed/ignored lists, and a `DISALLOWED` sentinel for invalid values
- **Classify sett** surfaces from `sett:length` (`mosaic_sett`, `small_sett`, `large_sett`) with size/length round-trip helpers
- **Derive `smoothness`** from tags with source and confidence metadata (`smoothness` → `surface` → `tracktype` → `mtb:scale` fallback chain)
- **Normalize** tagged `smoothness=*` values (legacy aliases like `horrible` → `very_bad`) without derived fallbacks
- **Suggest** OSM-safe parent `surface=*` (and optional `sett:length`) for side-attached infrastructure from parent highway tags

## Usage

```ts
import {
  sanitizeSurface,
  deriveSmoothness,
  suggestSurfaceFromParent,
  suggestSmoothnessFromSurface,
} from '@osm-editor-kit/osm-surface-quality'

const surface = sanitizeSurface({ surface: 'cobblestone' })
// → 'large_sett'

const { smoothness, smoothness_source } = deriveSmoothness({
  surface: 'gravel',
  tracktype: 'grade3',
})
// → { smoothness: 'bad', smoothness_source: 'surface_to_smoothness', ... }

const suggestion = suggestSurfaceFromParent({ surface: 'sett', 'sett:length': '0.10' })
// → { surface: 'sett', settLength: 0.1 }
```

Tag normalization and derivation only — not an OSM editor or tag writer.
