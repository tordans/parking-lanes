# `@osm-editor-kit/street-imagery`

**Status:** Private in-repo; first npm **alpha** publish wave.

## What it does

Provider-agnostic street-level imagery core: ten adapters (Mapillary, Panoramax, KartaView, Mapilio, Bing Streetside, Vegbilder, Google Street View, Apple Look Around, plus Mapillary signs and map features), normalized photo/sequence/map-feature types, bbox and MVT tile fetching, GeoJSON builders, viewfield geometry, date/type filters, and viewer helpers (deep links, click-radius grouping, thumbnails).

For MapLibre React layers, use `@osm-editor-kit/street-imagery-react`.

## Usage

```ts
import {
  adapterById,
  createStreetImageryConfig,
  photosToFeatureCollection,
  setStreetImageryConfig,
} from '@osm-editor-kit/street-imagery'

setStreetImageryConfig(
  createStreetImageryConfig({ mapillaryToken: '…' }),
)

const bbox = [13.44, 52.47, 13.45, 52.48] as const // west, south, east, north
const controller = new AbortController()
const photos = await adapterById.mapillary.fetchPhotos!(bbox, 16, controller.signal)
const geojson = photosToFeatureCollection(photos)
```
