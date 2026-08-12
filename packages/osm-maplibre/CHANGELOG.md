# @osm-editor-kit/osm-maplibre

## 0.1.0-alpha.0

### Minor Changes

- 8309d44: Initial npm alpha release.

  Core features to date:

  - OpenFreeMap Positron basemap style (patched bundled JSON, builder, CDN URL, imagery attribution constant)
  - Null-safe OpenFreeMap style filter patches for numeric compares on missing/null feature properties
  - Custom content anchor layer and source for stacking app overlays above the basemap via `beforeId`
  - MapLibre paint expressions for metre-based line width and offset (`lineWidthFromMeters`, `lineOffsetFromMeters`) with zoom-aware scaling helpers
  - Focus paint helpers (`focusCaseColor`, `focusCaseOpacity`) for active vs muted layer styling
