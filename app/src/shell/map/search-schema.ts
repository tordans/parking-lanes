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
export const bicycleFocusSchema = z.enum(['all', 'incomplete'])
export const surfaceFocusSchema = z.enum(['all', 'roads', 'path', 'sidewalks', 'bike'])

export const mapFocusSchema = z
  .object({
    parking: parkingFocusSchema.optional(),
    width: widthFocusSchema.optional(),
    bicycle: bicycleFocusSchema.optional(),
    surface: surfaceFocusSchema.optional(),
  })
  .optional()

export type ParkingFocus = z.infer<typeof parkingFocusSchema>
export type WidthFocus = z.infer<typeof widthFocusSchema>
export type BicycleFocus = z.infer<typeof bicycleFocusSchema>
export type SurfaceFocus = z.infer<typeof surfaceFocusSchema>
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
  if (focus.bicycle && focus.bicycle !== 'all') next.bicycle = focus.bicycle
  if (focus.surface && focus.surface !== 'all') next.surface = focus.surface

  return next.parking || next.width || next.bicycle || next.surface ? next : undefined
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
