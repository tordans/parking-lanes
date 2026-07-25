import {
  parseFeatureParam,
  parseMapParam,
  serializeFeatureParam,
  serializeMapParam,
} from '@osm-editor-kit/osm-map-url'
import { z } from 'zod'
import { parseDebugSearch } from '../debug'

export const parkingFocusSchema = z.enum(['all', 'noSurface'])
export const widthFocusSchema = z.enum(['all', 'car', 'bicycle'])

export const mapFocusSchema = z
  .object({
    parking: parkingFocusSchema.optional(),
    width: widthFocusSchema.optional(),
  })
  .optional()

export type ParkingFocus = z.infer<typeof parkingFocusSchema>
export type WidthFocus = z.infer<typeof widthFocusSchema>
export type MapFocus = z.infer<typeof mapFocusSchema>

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
  focus: mapFocusSchema,
})

export type MapSearch = z.infer<typeof mapSearchSchema>

function serializeMapFocus(focus: MapFocus | undefined): MapFocus | undefined {
  if (!focus) return undefined

  const next: NonNullable<MapFocus> = {}
  if (focus.parking && focus.parking !== 'all') next.parking = focus.parking
  if (focus.width && focus.width !== 'all') next.width = focus.width

  return next.parking || next.width ? next : undefined
}

export function serializeMapSearch(
  search: MapSearch,
): Record<string, string | boolean | MapFocus | undefined> {
  return {
    map: search.map ? serializeMapParam(search.map) : undefined,
    f: search.f ? serializeFeatureParam(search.f) : undefined,
    debug: search.debug,
    focus: serializeMapFocus(search.focus),
  }
}
