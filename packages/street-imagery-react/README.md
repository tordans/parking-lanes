# `@osm-editor-kit/street-imagery-react`

> [!NOTE]
> This package is an **alpha** release and still under active development. APIs may change; install with the npm `alpha` dist-tag.

## What it does

React + MapLibre UI on top of `@osm-editor-kit/street-imagery`:

- Map sources and layers for photos, sequences, and viewfields
- Click handling and interactive layer ids
- TanStack Query hooks to load provider data for the viewport
- Lazy Mapillary and Panoramax viewer panels
- Helpers for selection, thumbnails, and easing the map to a photo

## Usage

```tsx
import {
  StreetLevelImagerySourcesAndLayers,
  StreetLevelImageryViewer,
  useMapViewportBbox,
  queryStreetImageryFeatures,
  streetImageryInteractiveLayerIds,
} from '@osm-editor-kit/street-imagery-react'
import { createStreetImageryConfig } from '@osm-editor-kit/street-imagery'

const bbox = useMapViewportBbox('main', map)

<StreetLevelImagerySourcesAndLayers
  providers={['mapillary', 'panoramax']}
  bbox={bbox}
  zoom={map.zoom}
  filter={{ photoTypes: ['flat', 'pano'] }}
  options={{
    config: createStreetImageryConfig({ mapillaryToken: '…' }),
    showSequences: true,
    showViewfields: true,
    selectedPhoto,
    photoCircleColor: '#3b82f6',
    mapFeatureCircleColor: '#94a3b8',
  }}
/>

// interactiveLayerIds={streetImageryInteractiveLayerIds(providers)}
const hits = queryStreetImageryFeatures(event)

<StreetLevelImageryViewer photo={selectedPhoto} groupPhotos={sequencePhotos}
  onPhotoSelected={setSelection} onEaseMapToPoint={(lng, lat) => map.easeTo({ center: [lng, lat] })} />
```

**Mapillary:** `createStreetImageryConfig({ mapillaryToken })` or `setStreetImageryConfig` at boot (`@osm-editor-kit/street-imagery`). **Panoramax + Vite:** see `app/vite.config.ts` for the consuming-app setup.

Also: `useAllProviderPhotos`, `useProviderPhotos` / `useProviderSequences` / `useProviderMapFeatures`, `usePhotoThumbnails`, `resolveSelectedSequence`, `StreetLevelImageryViewCone`, `useViewerBearing` / `useViewerActions`, `MapillaryPanel`, `PanoramaxPanel`.
