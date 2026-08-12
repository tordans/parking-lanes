---
"@osm-editor-kit/osm-map-url": minor
---

Initial npm alpha release.

Core features to date:
- Parse and serialize compact `?map=zoom/lat/lng` URLs with optional bearing and zoom-based coordinate rounding
- Parse and serialize OSM feature refs (`?f=way/id`, including sidepath `way/id/cycleway|sidewalk/left|right`)
- Redirect legacy `#map=zoom/lat/lng` hash bookmarks to `?map=` query params
- TanStack Router search helpers that keep map and feature params in slash form instead of JSON in the URL bar
- Read and write last map view location from a `location` cookie
