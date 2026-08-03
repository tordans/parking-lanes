export type OsmMapElement = {
  type: string
  id: number
  lat?: number
  lon?: number
  nodes?: number[]
  members?: Array<{ type: string; ref: number; role?: string }>
  tags?: Record<string, string>
  [key: string]: unknown
}

export type MapBbox = {
  west: number
  south: number
  east: number
  north: number
}
