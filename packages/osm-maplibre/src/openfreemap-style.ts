import type { StyleSpecification } from 'maplibre-gl'
import openFreeMapPositronStyle from './styles/openfreemap-positron.json'
import { patchOpenFreeMapStyle } from './patch-openfreemap-style'

/** Upstream CDN URL — used to regenerate the checked-in patched style. */
export const OPENFREEMAP_POSITRON_STYLE_URL = 'https://tiles.openfreemap.org/styles/positron'

/** iD-style `imagery_used` label for the default basemap when no ELI overlay is active. */
export const OPENFREEMAP_POSITRON_IMAGERY_USED = 'OpenFreeMap Positron'

/**
 * Local patched Positron style (no runtime `transformStyle`).
 *
 * TEMPORARY — delete `styles/openfreemap-positron.json`, the fetch script, and
 * `patch-openfreemap-style.ts` once https://github.com/hyperknot/openfreemap/issues/107
 * is live on the CDN (upstream PR: https://github.com/hyperknot/openfreemap-styles/pull/18).
 * Then point the map at `OPENFREEMAP_POSITRON_STYLE_URL` again.
 */
export const OPENFREEMAP_POSITRON_STYLE = openFreeMapPositronStyle as StyleSpecification

export { patchOpenFreeMapStyle }
