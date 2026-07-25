import { parkingMode } from './parking'
import { createStubMode } from './stubs'
import type { StreetSpaceMode, StreetSpaceModeId } from './types'
import { widthMode } from './width'

export const streetSpaceModes: StreetSpaceMode[] = [
  parkingMode,
  widthMode,
  createStubMode('lanes', 'Lanes'),
  createStubMode('surface', 'Surface'),
  createStubMode('sidewalks', 'Sidewalks'),
]

const modesById = Object.fromEntries(streetSpaceModes.map((mode) => [mode.id, mode])) as Record<
  StreetSpaceModeId,
  StreetSpaceMode
>

export function getStreetSpaceMode(id: StreetSpaceModeId): StreetSpaceMode {
  return modesById[id]
}

export function useActiveStreetSpaceMode(id: StreetSpaceModeId): StreetSpaceMode {
  return getStreetSpaceMode(id)
}

export type { StreetSpaceMode, StreetSpaceModeId } from './types'
