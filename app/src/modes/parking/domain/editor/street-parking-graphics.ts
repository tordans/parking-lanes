import { assetUrl } from '../../../../utils/asset-url'

/** StreetComplete `res/graphics/street parking/` assets (CC-BY-SA 4.0, Tobias Zwick). */
export function streetParkingGraphic(filename: string): string {
  return assetUrl(`assets/street_parking/${filename}`)
}
