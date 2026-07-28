export type { LatLngLiteral, MapBounds } from '@osm-editor-kit/osm-data'

export interface ParkingFeatureProperties {
  featureId: string
  kind: 'lane' | 'missing' | 'area' | 'point' | 'backlight-right' | 'backlight-left'
  color: string
  weight: number
  offset: number
  side?: 'left' | 'right'
  osmType: string
  osmId: number
  isMajor?: boolean
  missingSurface?: 0 | 1
  nodeId?: number
  wayId?: number
}

export type ParkingGeometry = GeoJSON.LineString | GeoJSON.Point | GeoJSON.Polygon

export type ParkingFeature = GeoJSON.Feature<ParkingGeometry, ParkingFeatureProperties>

export type ParkingFeatureCollection = GeoJSON.FeatureCollection<
  ParkingGeometry,
  ParkingFeatureProperties
>
