# @osm-editor-kit/street-imagery

## 0.1.0-alpha.0

### Minor Changes

- 8309d44: Initial npm alpha release.

  Core features to date:

  - Provider adapter registry with ten sources (Mapillary, Panoramax, KartaView, Mapilio, Bing Streetside, Vegbilder, Google Street View, Apple Look Around, plus Mapillary signs and map features)
  - Normalized photo, sequence, and map-feature types with bbox/tile-based fetching
  - GeoJSON builders for photo points, sequence lines, and map-feature points
  - Viewfield geometry (heading wedges, pano disks, view cones) for map layers
  - Search filters by capture date, flat vs panorama, with MapLibre expression helpers
  - MVT tile fetch/decode, tile math, and in-memory tile cache
  - Runtime config (Mapillary token, Panoramax API base)
  - Viewer helpers: external deep links, click-radius nearest-photo grouping, thumbnail URL resolution
