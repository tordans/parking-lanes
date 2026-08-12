# `@osm-editor-kit/street-imagery-react`

**Status:** Private in-repo; first npm **alpha** publish wave.

## What it does

React MapLibre bindings for street-level imagery: map sources/layers, photo click handling, TanStack Query provider hooks, and lazy Mapillary/Panoramax viewer panels. Data adapters and GeoJSON helpers live in `@osm-editor-kit/street-imagery`.

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
