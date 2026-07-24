import { CircleParking, Footprints, Layers, type LucideIcon, Route, Ruler } from 'lucide-react'
import type { StreetSpaceModeId } from './types'

export const modeIcons: Record<StreetSpaceModeId, LucideIcon> = {
  parking: CircleParking,
  width: Ruler,
  lanes: Route,
  surface: Layers,
  sidewalks: Footprints,
}
