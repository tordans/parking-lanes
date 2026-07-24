import clsx from 'clsx'
import type { CSSProperties } from 'react'
import type { Side } from '../../utils/types/parking'

/** Matches selection backlights in map layers. */
export const parkingSideColors = {
  right: '#e66101',
  left: '#5e3c99',
} as const satisfies Record<Side, string>

export type ParkingEditorSide = Side | 'both'

const sideLabels: Record<ParkingEditorSide, string> = {
  both: 'Both sides',
  right: 'Right',
  left: 'Left',
}

export function parkingSideLabel(side: ParkingEditorSide) {
  return sideLabels[side]
}

export function parkingSideSectionClassName(_side: ParkingEditorSide) {
  return 'mb-4 overflow-hidden rounded-sm ring-1 ring-zinc-950/5 last:mb-0'
}

export function parkingSideSectionStyle(side: ParkingEditorSide): CSSProperties {
  switch (side) {
    case 'right':
      return { backgroundColor: `${parkingSideColors.right}20` }
    case 'left':
      return { backgroundColor: `${parkingSideColors.left}20` }
    case 'both':
      return {
        backgroundImage: `linear-gradient(90deg, ${parkingSideColors.left}24, ${parkingSideColors.right}24)`,
      }
  }
}

export function parkingSideHeaderClassName(side: ParkingEditorSide) {
  return clsx(
    'px-2 py-1 text-xs font-semibold tracking-wide text-white uppercase',
    side === 'both' &&
      'bg-gradient-to-r from-[var(--parking-side-left)] to-[var(--parking-side-right)]',
    side === 'right' && 'bg-[var(--parking-side-right)]',
    side === 'left' && 'bg-[var(--parking-side-left)]',
  )
}

export const parkingSideCssVariables = {
  '--parking-side-right': parkingSideColors.right,
  '--parking-side-left': parkingSideColors.left,
} as CSSProperties
