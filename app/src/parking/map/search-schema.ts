import { parseMapParam } from '@osm-editor-kit/osm-map-url'
import { z } from 'zod'
import { parseDebugSearch } from '../debug'

export const mapSearchSchema = z.object({
  map: z
    .string()
    .optional()
    .transform((s) => (s ? (parseMapParam(s) ?? undefined) : undefined)),
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
