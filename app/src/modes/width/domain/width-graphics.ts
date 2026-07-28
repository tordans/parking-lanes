import { assetUrl } from '../../../utils/asset-url'
import { wikiStreetParkingGraphic } from '../../parking/domain/editor/street-parking-graphics'

/** OSM Wiki carriageway width diagram (Key:width / width:carriageway). */
export function wikiWidthCarriagewayGraphic(): string {
  return assetUrl('assets/width/wiki/Width-carriageway.png')
}

/** Berlin / ERA buffer package diagram (paint counted in buffer). */
export function widthBufferIncludesPaintGraphic(): string {
  return assetUrl('assets/width/era-buffer-includes-paint.png')
}

export function wikiParkingLaneGraphic(): string {
  return wikiStreetParkingGraphic('Parking_position_lane.png')
}

export function wikiParkingStreetSideGraphic(): string {
  return wikiStreetParkingGraphic('Parking_position_street_side.png')
}
