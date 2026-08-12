# @osm-editor-kit/street-imagery-react

## 0.1.0-alpha.0

### Minor Changes

- 8309d44: Initial npm alpha release.

  Core features to date:

  - React MapLibre sources and layers for street imagery (photo points, sequences, viewfields, map features) driven by `@osm-editor-kit/street-imagery` provider adapters
  - `StreetLevelImageryViewer` with lazy-loaded Mapillary (`mapillary-js`) and Panoramax (`@panoramax/web-viewer`) photo panels
  - View-direction cone overlay (`StreetLevelImageryViewCone`) synced to live viewer POV via a Zustand store
  - Selection highlight overlay for the active photo and its sequence
  - TanStack Query hooks for per-provider and all-provider photo, sequence, and map-feature fetches with viewport bbox clipping
  - `useMapViewportBbox` hook for live WGS84 bbox from a react-map-gl map instance
  - Map click helpers (`streetImageryInteractiveLayerIds`, `queryStreetImageryFeatures`) for photos, viewfields, and map features
  - Photo type and date filtering on map layers plus thumbnail/full-URL query hooks

### Patch Changes

- Updated dependencies [8309d44]
  - @osm-editor-kit/street-imagery@0.1.0-alpha.0
