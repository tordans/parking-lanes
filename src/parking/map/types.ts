export interface MapBounds {
  south: number
  west: number
  north: number
  east: number
}

export interface LatLngLiteral {
  lat: number
  lng: number
}

export interface ParkingFeatureProperties {
  featureId: string
  kind: 'lane' | 'area' | 'point' | 'backlight-right' | 'backlight-left' | 'cut-marker'
  color: string
  weight: number
  offset: number
  osmType: string
  osmId: number
  isMajor?: boolean
  nodeId?: number
  wayId?: number
}

export type ParkingGeometry = GeoJSON.LineString | GeoJSON.Point | GeoJSON.Polygon

export type ParkingFeature = GeoJSON.Feature<ParkingGeometry, ParkingFeatureProperties>

export type ParkingFeatureCollection = GeoJSON.FeatureCollection<
  ParkingGeometry,
  ParkingFeatureProperties
>
