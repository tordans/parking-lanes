# `@osm-editor-kit/osm-maplibre`

> [!NOTE]
> This package is an **alpha** release and still under active development. APIs may change; install with the npm `alpha` dist-tag.

## What it does

- Ready-to-use OpenFreeMap Positron basemap style for MapLibre editors
- Anchor layer id so your overlays stack above the basemap
- Line width and offset from real-world metres (zoom-aware paint expressions)
- Focus styling helpers (highlight matching features, mute the rest)
- Utilities to patch or rebuild OpenFreeMap styles at runtime

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
