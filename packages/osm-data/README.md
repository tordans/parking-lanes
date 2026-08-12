# `@osm-editor-kit/osm-data`

> [!NOTE]
> This package is an **alpha** release and still under active development. APIs may change; install with the npm `alpha` dist-tag.

## What it does

- Fetch OSM JSON from Overpass or the OSM API
- Parse responses into in-memory indexes (ways, relations, tagged nodes, coordinates)
- Look up which ways belong to a relation
- Merge several downloads into one graph, preferring newer element versions
- Shared TypeScript types for parsed OSM session data

## Usage

```ts
import { downloadOsmData, parseOsmResp, mergeParsedOsm } from '@osm-editor-kit/osm-data'

const parsed = await downloadOsmData(overpassUrl)
const combined = mergeParsedOsm(parsed, parseOsmResp(rawOsmResp))
```

Fetch/parse/index only — not an OSM editor or tag writer.
