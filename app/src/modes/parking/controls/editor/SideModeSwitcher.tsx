import * as m from '@app/paraglide/messages'
import * as Headless from '@headlessui/react'
import clsx from 'clsx'
import { Label } from '../../../../components/catalyst/fieldset'
import { Switch } from '../../../../components/catalyst/switch'
import type { Side } from '../../../../utils/types/parking'
import { screenOrderedSidesSwitcherLabel } from '../../side-colors'

const sideSwitcherLabelClassName = 'text-xs select-none'

export function SideModeSwitcher(props: {
  bothBlockShown: boolean
  sideOrder?: [Side, Side]
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
        {props.sideOrder
          ? screenOrderedSidesSwitcherLabel(props.sideOrder)
          : `${m.editor_side_left()}/${m.editor_side_right()}`}
      </Label>
      <Switch
        checked={props.bothBlockShown}
        disabled={props.readOnly}
        onChange={props.onBothBlockShownChange}
        aria-label={m.editor_side_both_aria()}
      />
      <Label
        className={clsx(
          sideSwitcherLabelClassName,
          props.bothBlockShown ? 'font-semibold text-zinc-950' : 'text-zinc-500',
        )}
      >
        {m.editor_side_both()}
      </Label>
    </Headless.Field>
  )
}
