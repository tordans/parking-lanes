import * as m from '@app/paraglide/messages'
import * as Headless from '@headlessui/react'
import clsx from 'clsx'
import { Label } from '../../../components/catalyst/fieldset'
import { Switch } from '../../../components/catalyst/switch'

const switcherLabelClassName = 'text-xs select-none'

export function SurfaceChannelSwitcher(props: {
  sameMode: boolean
  readOnly: boolean
  leftLabel: string
  rightLabel: string
  onSameModeChange: (sameMode: boolean) => void
}) {
  return (
    <Headless.Field className="flex items-center gap-2">
      <Label
        className={clsx(
          switcherLabelClassName,
          props.sameMode ? 'text-zinc-500' : 'font-semibold text-zinc-950',
        )}
      >
        {props.leftLabel}
      </Label>
      <Switch
        checked={props.sameMode}
        disabled={props.readOnly}
        onChange={props.onSameModeChange}
        aria-label={m.surface_channel_both_aria()}
      />
      <Label
        className={clsx(
          switcherLabelClassName,
          props.sameMode ? 'font-semibold text-zinc-950' : 'text-zinc-500',
        )}
      >
        {props.rightLabel}
      </Label>
    </Headless.Field>
  )
}
