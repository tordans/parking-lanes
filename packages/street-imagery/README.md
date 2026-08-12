# `@osm-editor-kit/street-imagery`

> [!NOTE]
> This package is an **alpha** release and still under active development. APIs may change; install with the npm `alpha` dist-tag.

## What it does

- Talk to many street-photo providers through one adapter API (Mapillary, Panoramax, KartaView, Mapilio, Bing Streetside, Vegbilder, Google Street View, Apple Look Around, …)
- Normalize photos, sequences, and map features into shared types
- Fetch by map bbox or MVT tiles
- Build GeoJSON for map layers (points, sequences, viewfields)
- Filter by date and photo type (flat / panorama)
- Helpers for deep links, nearby-photo grouping, and thumbnails

For MapLibre React layers, use `@osm-editor-kit/street-imagery-react`.

## Usage

```ts
import {
  adapterById,
  createStreetImageryConfig,
  photosToFeatureCollection,
  setStreetImageryConfig,
} from '@osm-editor-kit/street-imagery'

setStreetImageryConfig(createStreetImageryConfig({ mapillaryToken: '…' }))

const bbox = [13.44, 52.47, 13.45, 52.48] as const // west, south, east, north
const controller = new AbortController()
const photos = await adapterById.mapillary.fetchPhotos!(bbox, 16, controller.signal)
const geojson = photosToFeatureCollection(photos)
```
