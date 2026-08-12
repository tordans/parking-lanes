---
"@osm-editor-kit/osm-data": minor
---

Initial npm alpha release — first alpha packaging of the existing kit package.

Core features to date:
- TypeScript types for OSM nodes, ways, relations, tags, and raw API responses
- Download OSM JSON from a URL and parse it into an indexed in-memory store
- Parse Overpass/API `elements` arrays into `ParsedOsmData` (ways, relations, tagged nodes, node coordinates, ways-in-relation lookup)
- Merge multiple fetches with version-aware updates for ways and relations
- Geo helper types (`MapBounds`, `LatLngLiteral`) for map bounds and coordinates
