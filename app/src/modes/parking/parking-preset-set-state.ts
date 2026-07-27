import { z } from 'zod'
import {
  DEFAULT_PARKING_PRESET_SET,
  isParkingPresetSetId,
  parkingPresetSetIds,
  type ParkingPresetSetId,
} from './domain/editor/preset-sets'

export const parkingPresetSetSchema = z.enum(parkingPresetSetIds)

export function readParkingPresetSet(presets: ParkingPresetSetId | undefined): ParkingPresetSetId {
  if (isParkingPresetSetId(presets)) return presets
  return DEFAULT_PARKING_PRESET_SET
}
