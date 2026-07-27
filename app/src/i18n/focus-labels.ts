import * as m from '@app/paraglide/messages'
import type { StreetSpaceModeId } from '../modes/types'
import type {
  BicycleFocus,
  ParkingFocus,
  SurfaceFocus,
  WidthFocus,
} from '../shell/map/search-schema'

type ParkingFocusOption = { value: ParkingFocus; label: string }
type WidthFocusOption = { value: WidthFocus; label: string }
type BicycleFocusOption = { value: BicycleFocus; label: string }
type SurfaceFocusOption = { value: SurfaceFocus; label: string }

const parkingFocusOptions = [
  { value: 'all', label: m.focus_all_parking },
  { value: 'noSurface', label: m.focus_no_surface },
] as const satisfies readonly { value: ParkingFocus; label: () => string }[]

const widthFocusOptions = [
  { value: 'all', label: m.focus_all_infra },
  { value: 'car', label: m.focus_car_roads },
  { value: 'bicycle', label: m.focus_bicycle_infra },
] as const satisfies readonly { value: WidthFocus; label: () => string }[]

const bicycleFocusOptions = [
  { value: 'all', label: m.focus_all_infra },
  { value: 'incomplete', label: m.focus_incomplete_infra },
] as const satisfies readonly { value: BicycleFocus; label: () => string }[]

const surfaceFocusOptions = [
  { value: 'all', label: m.focus_all_infra },
  { value: 'roads', label: m.focus_car_roads },
  { value: 'path', label: m.focus_paths },
  { value: 'sidewalks', label: m.focus_sidewalks },
  { value: 'bike', label: m.focus_bicycle_infra },
] as const satisfies readonly { value: SurfaceFocus; label: () => string }[]

function resolveFocusOptions<const T extends readonly { value: string; label: () => string }[]>(
  options: T,
): { value: T[number]['value']; label: string }[] {
  return options.map((option) => ({
    value: option.value,
    label: option.label(),
  }))
}

export function getFocusOptions(modeId: 'parking'): ParkingFocusOption[]
export function getFocusOptions(modeId: 'width'): WidthFocusOption[]
export function getFocusOptions(modeId: 'bicycle'): BicycleFocusOption[]
export function getFocusOptions(modeId: 'surface'): SurfaceFocusOption[]
export function getFocusOptions(
  modeId: Extract<StreetSpaceModeId, 'parking' | 'width' | 'bicycle' | 'surface'>,
): ParkingFocusOption[] | WidthFocusOption[] | BicycleFocusOption[] | SurfaceFocusOption[]
export function getFocusOptions(modeId: StreetSpaceModeId) {
  switch (modeId) {
    case 'parking':
      return resolveFocusOptions(parkingFocusOptions)
    case 'width':
      return resolveFocusOptions(widthFocusOptions)
    case 'bicycle':
      return resolveFocusOptions(bicycleFocusOptions)
    case 'surface':
      return resolveFocusOptions(surfaceFocusOptions)
    default:
      return []
  }
}
