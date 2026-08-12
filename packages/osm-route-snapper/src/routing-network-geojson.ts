import type { Feature, FeatureCollection, LineString } from 'geojson'
import initRouteSnapper, { JsRouteSnapper } from 'route-snapper'

let routeSnapperInitPromise: Promise<void> | undefined

async function ensureRouteSnapperReady() {
  if (!routeSnapperInitPromise) {
    routeSnapperInitPromise = initRouteSnapper().then(() => undefined)
  }
  await routeSnapperInitPromise
}

function emptyLineCollection(): FeatureCollection<LineString> {
  return { type: 'FeatureCollection', features: [] }
}

/** LineStrings for edges in the Rust/WASM route-snapper graph (split at intersections). */
export async function routingNetworkGeoJsonFromBytes(
  graphBytes: Uint8Array,
): Promise<FeatureCollection<LineString>> {
  await ensureRouteSnapperReady()
  const snapper = new JsRouteSnapper(graphBytes)
  try {
    const parsed = JSON.parse(snapper.debugRenderGraph()) as FeatureCollection
    const features = parsed.features.filter(
      (feature): feature is Feature<LineString> => feature.geometry?.type === 'LineString',
    )
    return { type: 'FeatureCollection', features }
  } finally {
    snapper.free()
  }
}

export function countRoutingNetworkEdges(collection: FeatureCollection<LineString>) {
  return collection.features.length
}

export { emptyLineCollection }
