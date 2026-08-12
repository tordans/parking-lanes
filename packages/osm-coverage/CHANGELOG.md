# @osm-editor-kit/osm-coverage

## 0.1.0-alpha.0

### Minor Changes

- 8309d44: Initial npm alpha release.

  Core features to date:

  - `createOsmCoverageApi` factory with TanStack Query session state (parsed OSM graph, coverage polygon, fetch-history GeoJSON) and `ensureCoverage` for incremental viewport downloads
  - Coverage geometry: missing-area detection, zoom-aware pixel buffering, strip vs full fetch heuristics, `unionIntoCoverage`, and capped fetch-history tracking
  - Overpass helpers: `boundsToOverpassBbox`, `buildOverpassInterpreterUrl`, and preset endpoints (`overpassDeUrl`, `overpassVkUrl`)
  - `OsmDataSource` enum for selecting download backends
  - `/dev-osm-map-fixture` subpath: local OSM Map API fixture handler, bbox element filtering, and fixture index loader

### Patch Changes

- Updated dependencies [8309d44]
  - @osm-editor-kit/osm-data@0.1.0-alpha.0
