# `@osm-editor-kit/osm-maplibre`

**Status:** Private in-repo; first npm **alpha** publish wave.

## What it does

MapLibre helpers for OSM editor maps: a patched OpenFreeMap Positron basemap (null-safe filters, custom overlay anchor), metre-based line width/offset paint expressions, and focus styling for active vs muted layers.

## Usage

```ts
import {
  OPENFREEMAP_POSITRON_STYLE,
  OPENFREEMAP_POSITRON_IMAGERY_USED,
  MAP_CUSTOM_CONTENT_ANCHOR_LAYER_ID,
  lineWidthFromMeters,
  lineOffsetFromMeters,
  focusCaseColor,
  focusCaseOpacity,
  metersPerPixel,
  buildOpenFreeMapPositronStyle,
  patchOpenFreeMapStyle,
} from '@osm-editor-kit/osm-maplibre'

// Default basemap for <Map mapStyle={…} />
const style = OPENFREEMAP_POSITRON_STYLE

// Stack app layers above the basemap (react-map-gl `beforeId`)
<Layer id="my-overlay" beforeId={MAP_CUSTOM_CONTENT_ANCHOR_LAYER_ID} … />

// Line width/offset from feature properties in metres (zoom-aware)
'line-width': lineWidthFromMeters('roadWidthM')
'line-width': lineWidthFromMeters('roadWidthM', { extraMeters: 2 }) // wider hit target
'line-offset': lineOffsetFromMeters('parentRoadWidthM', 0.5, {
  sign: ['case', ['==', ['get', 'side'], 'left'], -1, 1],
})

// Active vs muted styling when focus filter matches
'line-color': focusCaseColor(['==', ['get', 'infra'], 'car'], '#2563eb')
'line-opacity': focusCaseOpacity(['==', ['get', 'infra'], 'car'], 0.55)

metersPerPixel(16, 51) // ground metres per screen pixel at zoom/lat

// Patch a custom OpenFreeMap style JSON at runtime
buildOpenFreeMapPositronStyle(upstreamStyle)
patchOpenFreeMapStyle(upstreamStyle) // filters only
```

`maplibre-gl` is a dependency (`StyleSpecification` types). `OPENFREEMAP_POSITRON_IMAGERY_USED` is the iD-style `imagery_used` label when no ELI overlay is active.
