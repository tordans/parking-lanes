import { getImageryUsedValue } from '@osm-editor-kit/maplibre-editor-layer-index'
import { getLayerHydrated } from '@osm-editor-kit/maplibre-editor-layer-index/react'
import { createImageryUsageSession } from '@osm-editor-kit/osm-changeset'
import { OPENFREEMAP_POSITRON_IMAGERY_USED } from '@osm-editor-kit/osm-maplibre'

const session = createImageryUsageSession()

let currentBackgroundLayerId: string | null = null
let imageryRecordChain: Promise<void> = Promise.resolve()

/** Keep in sync with the active `?bg=` ELI layer (null = default OpenFreeMap). */
export function setCurrentBackgroundLayerId(layerId: string | null) {
  currentBackgroundLayerId = layerId
}

/** Active ELI background slug from `?bg=`, or `null` for the default OpenFreeMap basemap. */
export function getCurrentBackgroundLayerId(): string | null {
  return currentBackgroundLayerId
}

export function getImageryUsageValues() {
  return session.values()
}

export function clearImageryUsage() {
  session.clear()
  imageryRecordChain = Promise.resolve()
}

async function resolveImageryUsedValue(backgroundLayerId: string | null): Promise<string> {
  if (backgroundLayerId == null) return OPENFREEMAP_POSITRON_IMAGERY_USED

  const layer = await getLayerHydrated(backgroundLayerId)
  if (layer == null) return backgroundLayerId
  return getImageryUsedValue(layer)
}

/** Wait for pending edit-time imagery resolutions before reading session values. */
export async function ensureImageryUsageRecorded(): Promise<void> {
  await imageryRecordChain
}

/** Record the imagery visible during an edit (not on mere layer selection). */
export function recordEditingImagery(backgroundLayerId = currentBackgroundLayerId) {
  imageryRecordChain = imageryRecordChain.then(async () => {
    const value = await resolveImageryUsedValue(backgroundLayerId)
    session.record(value)
  })
}
