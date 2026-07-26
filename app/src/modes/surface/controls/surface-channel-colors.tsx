import type { ReactNode } from 'react'
import {
  ColoredEditorSection,
  type ColoredEditorSectionColor,
} from '../../../components/ColoredEditorSection'
import type { SurfaceChannelLabel } from '../domain/surface-edit-layout'

export const surfaceChannelColors = {
  foot: '#2b8cbe',
  cycle: '#33a02c',
  left: '#5e3c99',
  right: '#e66101',
  same: '#52525b',
} as const satisfies Record<Exclude<SurfaceChannelLabel, 'single'>, string>

export function surfaceChannelLabel(channel: SurfaceChannelLabel): string {
  switch (channel) {
    case 'foot':
      return 'Foot'
    case 'cycle':
      return 'Cycle'
    case 'left':
      return 'Left'
    case 'right':
      return 'Right'
    case 'same':
      return 'Both'
    case 'single':
      return 'Surface'
  }
}

export function surfaceChannelColor(
  channel: Exclude<SurfaceChannelLabel, 'single'>,
): ColoredEditorSectionColor {
  if (channel === 'same') return [surfaceChannelColors.left, surfaceChannelColors.right]
  return surfaceChannelColors[channel]
}

export function SurfaceChannelSection(props: {
  channel: SurfaceChannelLabel
  shown: boolean
  children: ReactNode
}) {
  if (!props.shown) return null

  if (props.channel === 'single') {
    return <div className="flex flex-col gap-3">{props.children}</div>
  }

  return (
    <ColoredEditorSection
      aria-label={surfaceChannelLabel(props.channel)}
      title={surfaceChannelLabel(props.channel)}
      color={surfaceChannelColor(props.channel)}
      contentClassName="py-2"
    >
      {props.children}
    </ColoredEditorSection>
  )
}
