import { assetUrl } from '../../../../utils/asset-url'
import { type TagValue } from '../../../../utils/types/parking'
import { streetParkingGraphic } from './street-parking-graphics'

export const laneValues: TagValue[] = [
  { value: 'lane', imgSrc: streetParkingGraphic('street.svg') },
  { value: 'street_side', imgSrc: streetParkingGraphic('street_parking_bays_parallel.svg') },
  { value: 'on_kerb', imgSrc: streetParkingGraphic('street_very_narrow.svg') },
  { value: 'half_on_kerb', imgSrc: streetParkingGraphic('street_narrow.svg') },
  { value: 'shoulder', imgSrc: streetParkingGraphic('street_shoulder.svg') },
  { value: 'no', imgSrc: streetParkingGraphic('no.svg') },
  { value: 'separate', imgSrc: streetParkingGraphic('separate.svg') },
  { value: 'yes', imgSrc: streetParkingGraphic('street_broad.svg') },
]

export const orientationValues: TagValue[] = [
  {
    value: 'parallel',
    imgSrc: streetParkingGraphic('street_marked_parking_parallel.svg'),
  },
  {
    value: 'diagonal',
    imgSrc: streetParkingGraphic('street_marked_parking_diagonal.svg'),
  },
  {
    value: 'perpendicular',
    imgSrc: streetParkingGraphic('street_marked_parking_perpendicular.svg'),
  },
]

export const reasonValues: TagValue[] = [
  { value: 'bus_lane' },
  { value: 'rails' },
  { value: 'bus_stop' },
  { value: 'crossing' },
  { value: 'cycleway' },
  { value: 'driveway' },
  { value: 'dual_carriage' },
  { value: 'fire_lane' },
  { value: 'junction' },
  { value: 'loading_zone' },
  { value: 'markings' },
  { value: 'narrow' },
  { value: 'passenger_loading_zone' },
  { value: 'priority_road' },
  { value: 'street_cleaning' },
  { value: 'turnaround' },
  { value: 'turn_lane' },
]

export const restrictionValues: TagValue[] = [
  { value: 'no_parking', imgSrc: assetUrl('assets/no_parking/no_parking.svg') },
  {
    value: 'no_standing',
    imgSrc: streetParkingGraphic('no_standing/no_standing.svg'),
  },
  { value: 'no_stopping', imgSrc: assetUrl('assets/no_stopping/no_stopping.svg') },
  { value: 'loading_only' },
  { value: 'charging_only' },
]

/**
 * Values from taginfo (2026-07-24), merged across:
 * - parking:both:surface
 * - parking:left:surface
 * - parking:right:surface
 * Unknown values on the way are appended at edit time by SelectInput.
 */
export const surfaceValues: TagValue[] = [
  { value: 'asphalt' },
  { value: 'paving_stones' },
  { value: 'sett' },
  { value: 'compacted' },
  { value: 'grass_paver' },
  { value: 'ground' },
  { value: 'concrete' },
  { value: 'cobblestone' },
  { value: 'unpaved' },
  { value: 'fine_gravel' },
  { value: 'dirt' },
  { value: 'grass' },
  { value: 'gravel' },
  { value: 'paved' },
  { value: 'grass_pavers' },
  { value: 'paving_stone' },
  { value: 'concrete:plates' },
  { value: 'honeycomb' },
]
