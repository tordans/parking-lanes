import * as m from '@app/paraglide/messages'
import type { OsmTags } from '@osm-editor-kit/osm-data'
import type { ColoredEditorSectionColor } from '../../components/ColoredEditorSection'
import type { Side } from '../../utils/types/parking'

/** Matches selection backlights in map layers. */
export const parkingSideColors = {
  right: '#e66101',
  left: '#5e3c99',
  /** Shared both-sides chrome (editor header + map selection bands). */
  both: '#18181b',
} as const satisfies Record<Side | 'both', string>

/** Gray body tint for the both-sides editor section. */
export const parkingBothBodyColor = '#71717a'

export type ParkingEditorSide = Side | 'both'

const sideLabels: Record<ParkingEditorSide, () => string> = {
  both: m.editor_side_both_sides,
  right: m.editor_side_right_side,
  left: m.editor_side_left_side,
}

export function screenOrderedSidesSwitcherLabel(sideOrder: [Side, Side]): string {
  const label = (side: Side) => (side === 'left' ? m.editor_side_left() : m.editor_side_right())
  return `${label(sideOrder[0])}/${label(sideOrder[1])}`
}

export function parkingSideLabel(side: ParkingEditorSide) {
  return sideLabels[side]()
}

export function parkingSideColor(side: ParkingEditorSide): ColoredEditorSectionColor {
  return parkingSideColors[side]
}

export function existsParkingSideTags(tags: OsmTags, side: ParkingEditorSide): boolean {
  const regex = new RegExp(`^parking:.*${side}`)
  return Object.keys(tags).some((key) => regex.test(key))
}

/** True when the way uses `parking:both*` only (no left/right side tags). */
export function isParkingBothMode(tags: OsmTags): boolean {
  return (
    existsParkingSideTags(tags, 'both') &&
    !existsParkingSideTags(tags, 'left') &&
    !existsParkingSideTags(tags, 'right')
  )
}
