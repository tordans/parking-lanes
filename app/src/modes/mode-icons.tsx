import {
  Bike,
  CircleParking,
  Footprints,
  Layers,
  type LucideIcon,
  Route,
  Ruler,
  Table2,
} from 'lucide-react'
import type { StreetSpaceModeId } from './types'

export const modeIcons: Record<StreetSpaceModeId, LucideIcon> = {
  parking: CircleParking,
  width: Ruler,
  bicycle: Bike,
  lanes: Route,
  table: Table2,
  surface: Layers,
  sidewalks: Footprints,
}
