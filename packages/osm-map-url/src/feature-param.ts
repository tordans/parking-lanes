import { z } from 'zod'

const OsmObjectTypeSchema = z.enum(['way', 'node', 'relation'])
const SidepathPrefixSchema = z.enum(['cycleway', 'sidewalk'])
const SidepathSideSchema = z.enum(['left', 'right'])

export type OsmFeatureRef = {
  type: z.infer<typeof OsmObjectTypeSchema>
  id: number
  prefix?: z.infer<typeof SidepathPrefixSchema>
  side?: z.infer<typeof SidepathSideSchema>
}

export const parseFeatureParam = (query: string): OsmFeatureRef | null => {
  const parts = query.split('/')

  if (parts.length === 2) {
    const parsed = z
      .object({
        type: OsmObjectTypeSchema,
        id: z.coerce.number().int().positive(),
      })
      .safeParse({ type: parts[0], id: parts[1] })

    return parsed.success ? parsed.data : null
  }

  if (parts.length === 4) {
    const parsed = z
      .object({
        type: z.literal('way'),
        id: z.coerce.number().int().positive(),
        prefix: SidepathPrefixSchema,
        side: SidepathSideSchema,
      })
      .safeParse({ type: parts[0], id: parts[1], prefix: parts[2], side: parts[3] })

    return parsed.success ? parsed.data : null
  }

  return null
}

export const serializeFeatureParam = ({ type, id, prefix, side }: OsmFeatureRef) => {
  if (prefix && side) {
    return `${type}/${id}/${prefix}/${side}`
  }
  return `${type}/${id}`
}
