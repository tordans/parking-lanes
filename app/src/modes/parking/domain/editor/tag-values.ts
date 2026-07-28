import { assetUrl } from '../../../../utils/asset-url'
import { type TagValue } from '../../../../utils/types/parking'
import { streetParkingGraphic, wikiStreetParkingGraphic } from './street-parking-graphics'

export const laneValues: TagValue[] = [
  { value: 'lane', imgSrc: wikiStreetParkingGraphic('Parking_position_lane.png') },
  { value: 'street_side', imgSrc: wikiStreetParkingGraphic('Parking_position_street_side.png') },
  { value: 'on_kerb', imgSrc: wikiStreetParkingGraphic('Parking_position_on_kerb.png') },
  {
    value: 'half_on_kerb',
    imgSrc: wikiStreetParkingGraphic('Parking_position_half_on_kerb.png'),
  },
  { value: 'shoulder', imgSrc: wikiStreetParkingGraphic('Parking_position_shoulder.png') },
  { value: 'no', imgSrc: wikiStreetParkingGraphic('Parking_position_no.png') },
  { value: 'separate', imgSrc: wikiStreetParkingGraphic('Parking_position_separate.png') },
  { value: 'yes', imgSrc: wikiStreetParkingGraphic('Parking_position_yes.png') },
]

export const orientationValues: TagValue[] = [
  {
    value: 'parallel',
    imgSrc: wikiStreetParkingGraphic('Parking_orientation_parallel.png'),
  },
  {
    value: 'diagonal',
    imgSrc: wikiStreetParkingGraphic('Parking_orientation_diagonal.png'),
  },
  {
    value: 'perpendicular',
    imgSrc: wikiStreetParkingGraphic('Parking_orientation_perpendicular.png'),
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
