import * as m from '@app/paraglide/messages'
import * as Headless from '@headlessui/react'
import clsx from 'clsx'
import { Label } from '../../../components/catalyst/fieldset'
import { Switch } from '../../../components/catalyst/switch'

const switcherLabelClassName = 'text-[10px] leading-none select-none'

export function SurfaceChannelSwitcher(props: {
  sameMode: boolean
  readOnly: boolean
  leftLabel: string
  rightLabel: string
  onSameModeChange: (sameMode: boolean) => void
  /** Compact styling for placement inside a colored section header. */
  compact?: boolean
}) {
  const compact = props.compact === true

  return (
    <Headless.Field className={clsx('flex items-center', compact ? 'gap-1' : 'gap-2')}>
      <Label
        className={clsx(
          switcherLabelClassName,
          compact && 'normal-case tracking-normal text-white/80',
          props.sameMode
            ? compact
              ? 'font-normal text-white/70'
              : 'text-zinc-500'
            : compact
              ? 'font-semibold text-white'
              : 'font-semibold text-zinc-950',
        )}
      >
        {props.leftLabel}
      </Label>
      <span className={compact ? 'inline-flex origin-center scale-75' : undefined}>
        <Switch
          checked={props.sameMode}
          disabled={props.readOnly}
          onChange={props.onSameModeChange}
          aria-label={m.surface_channel_both_aria()}
          color={compact ? 'white' : undefined}
        />
      </span>
      <Label
        className={clsx(
          switcherLabelClassName,
          compact && 'normal-case tracking-normal text-white/80',
          props.sameMode
            ? compact
              ? 'font-semibold text-white'
              : 'font-semibold text-zinc-950'
            : compact
              ? 'font-normal text-white/70'
              : 'text-zinc-500',
        )}
      >
        {props.rightLabel}
      </Label>
    </Headless.Field>
  )
}
