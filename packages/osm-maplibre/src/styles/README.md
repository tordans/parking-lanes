# OpenFreeMap Positron (local patched copy)

TEMPORARY vendor of https://tiles.openfreemap.org/styles/positron with local patches applied by `../patch-openfreemap-style.ts`.

**Remove this directory** (and the fetch script / predev hook / patch module) once the CDN serves the upstream fix:

- https://github.com/hyperknot/openfreemap/issues/107
- https://github.com/hyperknot/openfreemap-styles/pull/18

Regenerate:

```bash
FORCE=1 bun run --filter @osm-editor-kit/osm-maplibre fetch-openfreemap-style
```

Do not use MapLibre `transformStyle` / mid-load `setStyle` for these patches — that wiped custom layers (commit dd768419).
