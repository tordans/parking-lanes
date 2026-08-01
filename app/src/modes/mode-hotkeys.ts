import type { RegisterableHotkey } from '@tanstack/react-hotkeys'
import type { StreetSpaceModeId } from './types'

/** Home-row shortcuts for quick mode switching (qwerty order). */
export const MODE_HOTKEYS: Record<StreetSpaceModeId, RegisterableHotkey> = {
  parking: 'Q',
  width: 'W',
  bicycle: 'E',
  lanes: 'R',
  table: 'U',
  surface: 'T',
  sidewalks: 'Y',
}
