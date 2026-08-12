import { defineConfig } from 'tsup'

export default defineConfig({
  entry: { index: 'src/index.ts' },
  format: ['esm'],
  dts: false,
  clean: true,
  treeshake: true,
  sourcemap: false,
  external: ['@mapbox/vector-tile', 'pbf', 'maplibre-gl'],
})
