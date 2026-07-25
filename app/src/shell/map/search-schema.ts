import {
  parseFeatureParam,
  parseMapParam,
  serializeFeatureParam,
  serializeMapParam,
} from '@osm-editor-kit/osm-map-url'
import { z } from 'zod'
import { parseDebugSearch } from '../debug'

/** Shared map search params (mode is the `/$mode` path slug, e.g. `/parking`). */
export const mapSearchSchema = z.object({
  map: z
    .string()
    .optional()
    .transform((s) => (s ? (parseMapParam(s) ?? undefined) : undefined)),
  f: z
    .string()
    .optional()
    .transform((s) => (s ? (parseFeatureParam(s) ?? undefined) : undefined)),
  debug: z
    .union([
      z.boolean(),
      z.literal(1),
      z.literal(0),
      z.literal('1'),
      z.literal('true'),
      z.literal('0'),
      z.literal('false'),
    ])
    .optional()
    .transform(parseDebugSearch),
})

export type MapSearch = z.infer<typeof mapSearchSchema>

export function serializeMapSearch(
  search: MapSearch,
): Record<string, string | boolean | undefined> {
  return {
    map: search.map ? serializeMapParam(search.map) : undefined,
    f: search.f ? serializeFeatureParam(search.f) : undefined,
    debug: search.debug,
  }
}
