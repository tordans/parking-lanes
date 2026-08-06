# @osm-editor-kit/street-imagery-react

React MapLibre bindings for street-level imagery (Mapillary, Panoramax, …).

## Consuming app setup

Panoramax’s photo-only ESM entry and Vite CSS/PBF shims live in the **app** `vite.config.ts`, not in this package. Copy or adapt from the street-level-imagery overview app:

- `@panoramax/web-viewer` alias → `…/index_photoviewer.js`
- `panoramaxConstructableCssPlugin` and `panoramaxPbfDefaultExportPlugin`
- `optimizeDeps.exclude: ['@panoramax/web-viewer']`

Inject Mapillary credentials at boot via `setStreetImageryConfig(createStreetImageryConfig({ mapillaryToken }))` from `@osm-editor-kit/street-imagery`.
