# `@osm-editor-kit/osm-data`

**Status:** Private in-repo; first npm **alpha** publish wave.

## What it does

Download OSM JSON from a URL (Overpass or API) and parse it into indexed in-memory stores for ways, relations, tagged nodes, node coordinates, and ways-in-relation lookup. Exports shared TypeScript types and merges multiple fetches with version-aware updates.

## Usage

```ts
import { downloadOsmData, parseOsmResp, mergeParsedOsm } from '@osm-editor-kit/osm-data'

const parsed = await downloadOsmData(overpassUrl)
const combined = mergeParsedOsm(parsed, parseOsmResp(rawOsmResp))
```

Fetch/parse/index only — not an OSM editor or tag writer.
