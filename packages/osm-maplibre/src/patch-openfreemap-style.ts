import type { FilterSpecification, LayerSpecification, StyleSpecification } from 'maplibre-gl'

/**
 * TEMPORARY local patches for the OpenFreeMap Positron style.
 *
 * Remove this module (and `scripts/fetch-openfreemap-positron-style.ts`, the checked-in
 * `styles/openfreemap-positron.json`, and the predev fetch hook) once the CDN serves the
 * upstream fix:
 * - https://github.com/hyperknot/openfreemap/issues/107
 * - https://github.com/hyperknot/openfreemap-styles/pull/18
 *
 * Prefer a static patched JSON over MapLibre `transformStyle` / mid-load `setStyle` — that
 * approach wiped custom layers (see dd768419).
 */

const boundaryAdminLevelGuard: FilterSpecification = [
  '==',
  ['typeof', ['get', 'admin_level']],
  'number',
]

function filterAlreadyGuardsAdminLevel(filter: unknown): boolean {
  return JSON.stringify(filter).includes(JSON.stringify(boundaryAdminLevelGuard))
}

/** Guard `boundary_3` against null `admin_level` (openfreemap#107 / openfreemap-styles#18). */
function patchBoundary3Filter(layer: LayerSpecification): LayerSpecification {
  if (layer.id !== 'boundary_3' || !('filter' in layer) || !Array.isArray(layer.filter)) {
    return layer
  }

  const filter = layer.filter
  if (filter[0] !== 'all') return layer
  if (filterAlreadyGuardsAdminLevel(filter)) return layer

  return {
    ...layer,
    filter: ['all', boundaryAdminLevelGuard, ...filter.slice(1)] as FilterSpecification,
  }
}

/** Apply all local OpenFreeMap Positron customizations to a CDN style document. */
export function patchOpenFreeMapStyle(style: StyleSpecification): StyleSpecification {
  return {
    ...style,
    layers: style.layers.map(patchBoundary3Filter),
  }
}
