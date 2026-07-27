import { assetUrl } from '../../../../utils/asset-url'
import { type Preset } from '../../../../utils/types/preset'

export const parkingPresetSetIds = ['default', 'russia'] as const
export type ParkingPresetSetId = (typeof parkingPresetSetIds)[number]
export const DEFAULT_PARKING_PRESET_SET: ParkingPresetSetId = 'default'

const noStoppingPreset: Preset = {
  key: 'noStopping',
  tags: [
    { k: 'parking:{side}', v: 'no' },
    { k: 'parking:{side}:restriction', v: 'no_stopping' },
    { k: 'parking:{side}:reason', v: '' },
    { k: 'parking:{side}:orientation', v: '' },
    { k: 'parking:{side}:fee', v: '' },
    { k: 'parking:{side}:fee:conditional', v: '' },
    { k: 'parking:{side}:maxstay', v: '' },
    { k: 'parking:{side}:maxstay:conditional', v: '' },
    { k: 'parking:{side}:access', v: '' },
    { k: 'parking:{side}:access:conditional', v: '' },
    { k: 'parking:{side}:restriction:conditional', v: '' },
    { k: 'parking:{side}:restriction:reason', v: '' },
  ],
  img: {
    src: assetUrl('assets/no_stopping/no_stopping.svg'),
    height: 20,
    width: 20,
    alt: 'No Stopping Sign',
    title: 'No Stopping',
  },
}

const noParkingPreset: Preset = {
  key: 'noParking',
  tags: [
    { k: 'parking:{side}', v: 'no' },
    { k: 'parking:{side}:restriction', v: 'no_parking' },
    { k: 'parking:{side}:reason', v: '' },
    { k: 'parking:{side}:orientation', v: '' },
    { k: 'parking:{side}:fee', v: '' },
    { k: 'parking:{side}:fee:conditional', v: '' },
    { k: 'parking:{side}:maxstay', v: '' },
    { k: 'parking:{side}:maxstay:conditional', v: '' },
    { k: 'parking:{side}:access', v: '' },
    { k: 'parking:{side}:access:conditional', v: '' },
    { k: 'parking:{side}:restriction:conditional', v: '' },
    { k: 'parking:{side}:restriction:reason', v: '' },
  ],
  img: {
    src: assetUrl('assets/no_parking/no_parking.svg'),
    height: 20,
    width: 20,
    alt: 'No Parking Sign',
    title: 'No Parking',
  },
}

const noParkingOddPreset: Preset = {
  key: 'noParkingOdd',
  tags: [
    { k: 'parking:{side}', v: 'yes' },
    { k: 'parking:{side}:restriction', v: 'no_parking' },
    { k: 'parking:{side}:restriction:conditional', v: 'none @ 1-31/2' },
    { k: 'parking:{side}:reason', v: '' },
    { k: 'parking:{side}:orientation', v: '' },
    { k: 'parking:{side}:fee', v: '' },
    { k: 'parking:{side}:fee:conditional', v: '' },
    { k: 'parking:{side}:maxstay', v: '' },
    { k: 'parking:{side}:maxstay:conditional', v: '' },
    { k: 'parking:{side}:access', v: '' },
    { k: 'parking:{side}:access:conditional', v: '' },
    { k: 'parking:{side}:restriction:reason', v: '' },
  ],
  img: {
    src: assetUrl('assets/no_parking/no_parking_on_odd_days.svg'),
    height: 20,
    width: 20,
    alt: 'No Parking on Odd Days Sign',
    title: 'No Parking on Odd Days',
  },
}

const noParkingEvenPreset: Preset = {
  key: 'noParkingEven',
  tags: [
    { k: 'parking:{side}', v: 'yes' },
    { k: 'parking:{side}:restriction', v: 'no_parking' },
    { k: 'parking:{side}:restriction:conditional', v: 'none @ 2-30/2' },
    { k: 'parking:{side}:reason', v: '' },
    { k: 'parking:{side}:orientation', v: '' },
    { k: 'parking:{side}:fee', v: '' },
    { k: 'parking:{side}:fee:conditional', v: '' },
    { k: 'parking:{side}:maxstay', v: '' },
    { k: 'parking:{side}:maxstay:conditional', v: '' },
    { k: 'parking:{side}:access', v: '' },
    { k: 'parking:{side}:access:conditional', v: '' },
    { k: 'parking:{side}:restriction', v: '' },
    { k: 'parking:{side}:restriction:conditional', v: '' },
    { k: 'parking:{side}:restriction:reason', v: '' },
  ],
  img: {
    src: assetUrl('assets/no_parking/no_parking_on_even_days.svg'),
    height: 20,
    width: 20,
    alt: 'No Parking on Even Days Sign',
    title: 'No Parking on Even Days',
  },
}

const freeParkingPreset: Preset = {
  key: 'parking',
  tags: [
    { k: 'parking:{side}', v: 'yes' },
    { k: 'parking:{side}:reason', v: '' },
    { k: 'parking:{side}:orientation', v: '' },
    { k: 'parking:{side}:fee', v: '' },
    { k: 'parking:{side}:fee:conditional', v: '' },
    { k: 'parking:{side}:maxstay', v: '' },
    { k: 'parking:{side}:maxstay:conditional', v: '' },
    { k: 'parking:{side}:access', v: '' },
    { k: 'parking:{side}:access:conditional', v: '' },
    { k: 'parking:{side}:restriction', v: '' },
    { k: 'parking:{side}:restriction:conditional', v: '' },
    { k: 'parking:{side}:restriction:reason', v: '' },
  ],
  img: {
    src: assetUrl('assets/free_parking/free_parking_russia.svg'),
    height: 20,
    width: 20,
    alt: 'Free Parking Sign',
    title: 'Free Parking',
  },
}

const paidParkingPreset: Preset = {
  key: 'ticket',
  tags: [
    { k: 'parking:{side}', v: 'yes' },
    { k: 'parking:{side}:fee', v: 'yes' },
    { k: 'parking:{side}:reason', v: '' },
    { k: 'parking:{side}:orientation', v: '' },
    { k: 'parking:{side}:fee:conditional', v: '' },
    { k: 'parking:{side}:maxstay', v: '' },
    { k: 'parking:{side}:maxstay:conditional', v: '' },
    { k: 'parking:{side}:access', v: '' },
    { k: 'parking:{side}:access:conditional', v: '' },
    { k: 'parking:{side}:restriction', v: '' },
    { k: 'parking:{side}:restriction:conditional', v: '' },
    { k: 'parking:{side}:restriction:reason', v: '' },
  ],
  img: {
    src: assetUrl('assets/paid_parking/paid_parking_russia.svg'),
    height: 20,
    width: 40,
    alt: 'Paid Parking Sign',
    title: 'Paid Parking',
  },
}

export const parkingPresetSets: Record<ParkingPresetSetId, Preset[]> = {
  default: [noStoppingPreset, noParkingPreset],
  russia: [
    noStoppingPreset,
    noParkingPreset,
    noParkingOddPreset,
    noParkingEvenPreset,
    freeParkingPreset,
    paidParkingPreset,
  ],
}

export function getParkingPresets(setId: ParkingPresetSetId): Preset[] {
  return parkingPresetSets[setId]
}

export function isParkingPresetSetId(value: string | undefined): value is ParkingPresetSetId {
  return value != null && parkingPresetSetIds.includes(value as ParkingPresetSetId)
}
