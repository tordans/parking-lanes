const assetModules = import.meta.glob<string>(
  '/node_modules/@osm-editor-kit/surface-smoothness-data/dist/generated/**/*.{jpg,svg}',
  { eager: true, query: '?url', import: 'default' },
)

const assetUrlByRelativePath = Object.fromEntries(
  Object.entries(assetModules).map(([modulePath, url]) => {
    const match = modulePath.match(/dist\/generated\/(.+)$/)
    return [match?.[1] ?? modulePath, url]
  }),
)

/** Resolve a package-relative asset path from `@osm-editor-kit/surface-smoothness-data` (e.g. `images/surface_asphalt.jpg`). */
export function surfaceDataAssetUrl(relativePath: string): string {
  return assetUrlByRelativePath[relativePath] ?? ''
}
