import * as m from '@app/paraglide/messages'
import type { ColoredEditorSectionColor } from '../../components/ColoredEditorSection'
import type { Side } from '../../utils/types/parking'

/** Matches selection backlights in map layers. */
export const parkingSideColors = {
  right: '#e66101',
  left: '#5e3c99',
} as const satisfies Record<Side, string>

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
  if (side === 'both') return [parkingSideColors.left, parkingSideColors.right]
  return parkingSideColors[side]
}
