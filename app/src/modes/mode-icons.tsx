import {
  Bike,
  CircleParking,
  Footprints,
  Layers,
  type LucideIcon,
  Route,
  Ruler,
} from 'lucide-react'
import type { StreetSpaceModeId } from './types'

export const modeIcons: Record<StreetSpaceModeId, LucideIcon> = {
  parking: CircleParking,
  width: Ruler,
  bicycle: Bike,
  lanes: Route,
  surface: Layers,
  sidewalks: Footprints,
}
