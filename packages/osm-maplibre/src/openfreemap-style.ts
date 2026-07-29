import type { StyleSpecification } from 'maplibre-gl'
import { appendCustomContentAnchor } from './custom-content-anchor'
import { patchOpenFreeMapStyle } from './patch-openfreemap-style'
import openFreeMapPositronStyle from './styles/openfreemap-positron.json'

/** Upstream CDN URL — used to regenerate the checked-in patched style. */
export const OPENFREEMAP_POSITRON_STYLE_URL = 'https://tiles.openfreemap.org/styles/positron'

/** iD-style `imagery_used` label for the default basemap when no ELI overlay is active. */
export const OPENFREEMAP_POSITRON_IMAGERY_USED = 'OpenFreeMap Positron'

/** Patches upstream Positron (null-safe filters + app layer anchor). */
export function buildOpenFreeMapPositronStyle(style: StyleSpecification): StyleSpecification {
  return appendCustomContentAnchor(patchOpenFreeMapStyle(style))
}

/**
 * Local patched Positron style (no runtime `transformStyle`).
 *
 * TEMPORARY — delete `styles/openfreemap-positron.json`, the fetch script, and
 * `patch-openfreemap-style.ts` once https://github.com/hyperknot/openfreemap/issues/107
 * is live on the CDN with null-safe filters (upstream PR only fixed `boundary_3`:
 * https://github.com/hyperknot/openfreemap-styles/pull/18). Then point the map at
 * `OPENFREEMAP_POSITRON_STYLE_URL` again.
 */
export const OPENFREEMAP_POSITRON_STYLE = buildOpenFreeMapPositronStyle(
  openFreeMapPositronStyle as StyleSpecification,
)

export { appendCustomContentAnchor, patchOpenFreeMapStyle }
export {
  MAP_CUSTOM_CONTENT_ANCHOR_LAYER_ID,
  MAP_CUSTOM_CONTENT_ANCHOR_SOURCE_ID,
} from './custom-content-anchor'
