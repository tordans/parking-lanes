import { defineConfig } from 'tsup'

export default defineConfig({
  entry: { index: 'src/index.ts' },
  format: ['esm'],
  dts: false,
  clean: true,
  treeshake: true,
  sourcemap: false,
  // Keep vendored WASM glue external so import.meta.url resolves next to the .wasm file.
  external: [
    /@osm-editor-kit\//,
    /^@tanstack\//,
    'react',
    'route-snapper',
    /vendor\/osm-to-route-snapper/,
  ],
})
