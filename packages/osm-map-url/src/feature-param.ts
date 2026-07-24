import { z } from 'zod'

const OsmObjectTypeSchema = z.enum(['way', 'node', 'relation'])

export type OsmFeatureRef = {
  type: z.infer<typeof OsmObjectTypeSchema>
  id: number
}

export const parseFeatureParam = (query: string): OsmFeatureRef | null => {
  const parts = query.split('/')
  if (parts.length !== 2) return null

  const parsed = z
    .object({
      type: OsmObjectTypeSchema,
      id: z.coerce.number().int().positive(),
    })
    .safeParse({ type: parts[0], id: parts[1] })

  return parsed.success ? parsed.data : null
}

export const serializeFeatureParam = ({ type, id }: OsmFeatureRef) => `${type}/${id}`
