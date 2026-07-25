import * as Headless from '@headlessui/react'
import clsx from 'clsx'
import { Label } from '../../../../components/catalyst/fieldset'
import { Switch } from '../../../../components/catalyst/switch'

const sideSwitcherLabelClassName = 'text-xs select-none'

export function SideModeSwitcher(props: {
  bothBlockShown: boolean
  readOnly: boolean
  onBothBlockShownChange: (checked: boolean) => void
}) {
  return (
    <Headless.Field className="flex items-center gap-2">
      <Label
        className={clsx(
          sideSwitcherLabelClassName,
          props.bothBlockShown ? 'text-zinc-500' : 'font-semibold text-zinc-950',
        )}
      >
        Left/Right
      </Label>
      <Switch
        checked={props.bothBlockShown}
        disabled={props.readOnly}
        onChange={props.onBothBlockShownChange}
        aria-label="Toggle both sides editor"
      />
      <Label
        className={clsx(
          sideSwitcherLabelClassName,
          props.bothBlockShown ? 'font-semibold text-zinc-950' : 'text-zinc-500',
        )}
      >
        Both
      </Label>
    </Headless.Field>
  )
}
