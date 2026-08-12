# @osm-editor-kit/osm-route-snapper

## 0.1.0-alpha.0

### Minor Changes

- 8309d44: Initial npm alpha release.

  Core features to date:

  - Build route-snapper bincode graph bytes from merged session `ParsedOsmData` via vendored `osm-to-route-snapper` WASM
  - Serialize parsed OSM coverage to minimal OSM XML for graph conversion
  - Extract routing-network GeoJSON (intersection-split edges) from graph bytes using `route-snapper` WASM
  - GeoJSON LineStrings for Overpass/session highway ways and a coverage graph signature for cache keys
  - TanStack Query factory that rebuilds the graph when Overpass coverage grows

### Patch Changes

- Updated dependencies [8309d44]
  - @osm-editor-kit/osm-data@0.1.0-alpha.0
