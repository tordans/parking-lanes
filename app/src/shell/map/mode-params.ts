import type { StreetSpaceModeId } from '../../modes/types'

export const streetSpaceModeIds = [
  'parking',
  'width',
  'bicycle',
  'lanes',
  'surface',
  'sidewalks',
] as const satisfies readonly StreetSpaceModeId[]

export type StreetSpaceModeSlug = (typeof streetSpaceModeIds)[number]

export function isStreetSpaceModeId(value: string): value is StreetSpaceModeId {
  return (streetSpaceModeIds as readonly string[]).includes(value)
}

export function parseModeSlug(value: string | undefined): StreetSpaceModeId {
  if (value && isStreetSpaceModeId(value)) return value
  return 'parking'
}
