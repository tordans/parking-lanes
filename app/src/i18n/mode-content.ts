import * as m from '@app/paraglide/messages'
import type { StreetSpaceModeId } from '../modes/types'

const modeLabelById = {
  parking: m.mode_parking_label,
  width: m.mode_width_label,
  bicycle: m.mode_bicycle_label,
  lanes: m.mode_lanes_label,
  surface: m.mode_surface_label,
  sidewalks: m.mode_sidewalks_label,
} as const satisfies Record<StreetSpaceModeId, () => string>

const modeAboutDescriptionById = {
  parking: m.mode_parking_about,
  width: m.mode_width_about,
  bicycle: m.mode_bicycle_about,
  lanes: m.mode_lanes_about,
  surface: m.mode_surface_about,
  sidewalks: m.mode_sidewalks_about,
} as const satisfies Record<StreetSpaceModeId, () => string>

export function getModeLabel(id: StreetSpaceModeId): string {
  return modeLabelById[id]()
}

export function getModeAboutDescription(id: StreetSpaceModeId): string {
  return modeAboutDescriptionById[id]()
}

export function getModeStubAbout(modeLabel: string): string {
  return m.mode_stub_about({ modeLabel })
}
