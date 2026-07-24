import { type TagValue } from '../../../../utils/types/parking'
import { SelectInput } from './SelectInput'
import { isYesNoTagValues } from './tag-editor-controls'
import { TagValueIconShortcuts } from './TagValueIconShortcuts'
import { YesNoRadioInput } from './YesNoRadioInput'

export function TagValueInput(props: {
  tag: string
  value: string | undefined
  values: TagValue[]
  disabled?: boolean
  iconShortcuts?: boolean
  onChange: (tagValue: string) => void
}) {
  const value = props.value ?? ''
  const showIconShortcuts = props.iconShortcuts ?? true

  if (isYesNoTagValues(props.values)) {
    return (
      <YesNoRadioInput
        name={props.tag}
        value={value}
        disabled={props.disabled}
        onChange={props.onChange}
      />
    )
  }

  if (!showIconShortcuts) {
    return (
      <SelectInput
        tag={props.tag}
        value={value}
        values={props.values}
        disabled={props.disabled}
        onChange={props.onChange}
      />
    )
  }

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-1">
      <div className="min-w-0 flex-1">
        <SelectInput
          tag={props.tag}
          value={value}
          values={props.values}
          disabled={props.disabled}
          onChange={props.onChange}
        />
      </div>
      <TagValueIconShortcuts
        value={value}
        values={props.values}
        disabled={props.disabled}
        onChange={props.onChange}
      />
    </div>
  )
}
