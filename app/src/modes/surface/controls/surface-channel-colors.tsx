import clsx from 'clsx'
import type { CSSProperties, ReactNode } from 'react'
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

export function surfaceChannelSectionStyle(channel: SurfaceChannelLabel): CSSProperties {
  switch (channel) {
    case 'foot':
      return { backgroundColor: `${surfaceChannelColors.foot}20` }
    case 'cycle':
      return { backgroundColor: `${surfaceChannelColors.cycle}20` }
    case 'left':
      return { backgroundColor: `${surfaceChannelColors.left}20` }
    case 'right':
      return { backgroundColor: `${surfaceChannelColors.right}20` }
    case 'same':
      return {
        backgroundImage: `linear-gradient(90deg, ${surfaceChannelColors.left}24, ${surfaceChannelColors.right}24)`,
      }
    case 'single':
      return {}
  }
}

export function surfaceChannelHeaderClassName(channel: SurfaceChannelLabel) {
  return clsx(
    'px-2 py-1 text-xs font-semibold tracking-wide text-white uppercase',
    channel === 'same' &&
      'bg-gradient-to-r from-[var(--surface-channel-left)] to-[var(--surface-channel-right)]',
    channel === 'right' && 'bg-[var(--surface-channel-right)]',
    channel === 'left' && 'bg-[var(--surface-channel-left)]',
    channel === 'foot' && 'bg-[var(--surface-channel-foot)]',
    channel === 'cycle' && 'bg-[var(--surface-channel-cycle)]',
  )
}

export const surfaceChannelCssVariables = {
  '--surface-channel-right': surfaceChannelColors.right,
  '--surface-channel-left': surfaceChannelColors.left,
  '--surface-channel-foot': surfaceChannelColors.foot,
  '--surface-channel-cycle': surfaceChannelColors.cycle,
} as CSSProperties

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
    <section
      aria-label={surfaceChannelLabel(props.channel)}
      className="mb-4 overflow-hidden rounded-sm ring-1 ring-zinc-950/5 last:mb-0"
      style={{ ...surfaceChannelCssVariables, ...surfaceChannelSectionStyle(props.channel) }}
    >
      <div className={surfaceChannelHeaderClassName(props.channel)}>
        {surfaceChannelLabel(props.channel)}
      </div>
      <div className="px-2 py-2">{props.children}</div>
    </section>
  )
}
