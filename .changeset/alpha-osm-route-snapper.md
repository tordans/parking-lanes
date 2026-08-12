---
"@osm-editor-kit/osm-route-snapper": minor
---

Initial npm alpha release.

Core features to date:
- Build route-snapper bincode graph bytes from merged session `ParsedOsmData` via vendored `osm-to-route-snapper` WASM
- Serialize parsed OSM coverage to minimal OSM XML for graph conversion
- Extract routing-network GeoJSON (intersection-split edges) from graph bytes using `route-snapper` WASM
- GeoJSON LineStrings for Overpass/session highway ways and a coverage graph signature for cache keys
- TanStack Query factory that rebuilds the graph when Overpass coverage grows
