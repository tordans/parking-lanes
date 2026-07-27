import type { FilterSpecification } from 'maplibre-gl'

/** TILDA atlas boundary tiles (district Bezirke / Landkreise). */
export const ATLAS_BOUNDARIES_SOURCE_ID = 'atlas-boundaries'
export const ATLAS_BOUNDARIES_TILES_URL =
  'https://tiles.tilda-geo.de/atlas_generalized_boundaries,atlas_generalized_boundarylabels/{z}/{x}/{y}'

/** Matches TILDA `category_district_landkreis` line style. */
export const atlasDistrictLinePaint = {
  'line-color': '#eab590',
  'line-dasharray': [2.5, 1, 1, 1],
  'line-opacity': 0.6,
  'line-width': 2,
}

export const atlasDistrictLabelPaint = {
  'text-color': '#bc6a2f',
  'text-halo-color': '#ffffff',
  'text-halo-width': 2,
}

/** Campaign highlight for Friedrichshain-Kreuzberg (Berlin). */
export const atlasXhainHighlightPaint = {
  'line-color': '#2563eb',
  'line-opacity': 0.9,
  'line-width': 3,
}

export const atlasDistrictFilter: FilterSpecification = ['has', 'category_district']
