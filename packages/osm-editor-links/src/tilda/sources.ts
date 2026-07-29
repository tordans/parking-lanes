/**
 * TILDA `f` parameter sourceNumericId ↔ source name.
 * Mirrors tilda-geo `useFeaturesParam/url.ts` (atlas / Lars / Mapillary / TILDA parking).
 */
export const TILDA_SOURCE_NUMERIC_IDS: Record<number, string> = {
  1: 'osm_notes',
  2: 'lars_parking',
  3: 'lars_parking_debug',
  4: 'lars_parking_points',
  5: 'lars_parking_areas',
  6: 'lars_parking_stats',
  7: 'atlas_boundaries',
  8: 'atlas_presenceStats',
  9: 'accidents_unfallatlas',
  10: 'atlas_bikelanes',
  11: 'atlas_bikeroutes',
  12: 'atlas_roads',
  13: 'atlas_roadsPathClasses',
  14: 'atlas_publicTransport',
  15: 'atlas_poiClassification',
  16: 'atlas_places',
  17: 'atlas_barriers',
  18: 'atlas_landuse',
  19: 'atlas_bicycleParking',
  20: 'atlas_trafficSigns',
  21: 'mapillary_coverage',
  22: 'atlas_bikelanesPresence',
  23: 'atlas_bikeSuitability',
  24: 'atlas_todos_lines',
  25: 'atlas_aggregated_lengths',
  26: 'tilda_parkings',
  27: 'tilda_parkings_cutouts',
  28: 'tilda_parkings_quantized',
  30: 'tilda_parkings_no',
  31: 'tilda_parkings_off_street',
  32: 'tilda_parkings_off_street_quantized',
}

const sourceIdToNumeric = new Map(
  Object.entries(TILDA_SOURCE_NUMERIC_IDS).map(([id, name]) => [name, Number(id)]),
)

/** Resolve TILDA source name → compact numeric id used in `f=`. */
export function tildaSourceNumericId(sourceId: string): number | undefined {
  return sourceIdToNumeric.get(sourceId)
}

export function tildaSourceIdFromNumeric(numericId: number): string | undefined {
  return TILDA_SOURCE_NUMERIC_IDS[numericId]
}
