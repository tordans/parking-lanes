import type {
  FilterSpecification,
  LayerSpecification,
  StyleSpecification,
  TransformStyleFunction,
} from 'maplibre-gl'

export const OPENFREEMAP_POSITRON_STYLE_URL = 'https://tiles.openfreemap.org/styles/positron'

/** iD-style `imagery_used` label for the default basemap when no ELI overlay is active. */
export const OPENFREEMAP_POSITRON_IMAGERY_USED = 'OpenFreeMap Positron'

const boundaryAdminLevelGuard: FilterSpecification = [
  '==',
  ['typeof', ['get', 'admin_level']],
  'number',
]

function patchBoundary3Filter(layer: LayerSpecification): LayerSpecification {
  if (layer.id !== 'boundary_3' || !('filter' in layer) || !Array.isArray(layer.filter)) {
    return layer
  }

  const filter = layer.filter
  if (filter[0] !== 'all') return layer

  return {
    ...layer,
    filter: ['all', boundaryAdminLevelGuard, ...filter.slice(1)] as FilterSpecification,
  }
}

/** Guard boundary layers against null admin_level (openfreemap-styles#18, CDN not yet updated). */
export function patchOpenFreeMapStyle(style: StyleSpecification): StyleSpecification {
  return {
    ...style,
    layers: style.layers.map(patchBoundary3Filter),
  }
}

/** For MapLibre `setStyle` / `transformStyle` when loading the CDN URL directly. */
export const openFreeMapTransformStyle: TransformStyleFunction = (_previous, next) =>
  patchOpenFreeMapStyle(next)
