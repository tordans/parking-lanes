import { TagEditorClearValueButton } from './TagEditorClearValueButton'
import { TagEditorTextInput } from './TagEditorTextInput'
import { YesNoRadioInput, type YesNoValue } from './YesNoRadioInput'

/** Empty / yes / no use the shared yes–no control; any other existing value falls back to text. */
export function isYesNoCompatibleValue(value: string): boolean {
  return value === '' || value === 'yes' || value === 'no'
}

export function YesNoOrTextInput(props: {
  name: string
  value: string
  impliedValue?: YesNoValue
  impliedHint?: string
  disabled?: boolean
  onChange: (tagValue: string) => void
}) {
  if (isYesNoCompatibleValue(props.value)) {
    return (
      <YesNoRadioInput
        name={props.name}
        value={props.value}
        impliedValue={props.impliedValue}
        impliedHint={props.impliedHint}
        disabled={props.disabled}
        onChange={props.onChange}
      />
    )
  }

  return (
    <TagEditorTextInput
      tag={props.name}
      value={props.value}
      disabled={props.disabled}
      onChange={props.onChange}
    />
  )
}

/** Stacked label + optional clear (x) + yes/no (or text fallback) for non-table forms. */
export function YesNoOrTextField(props: {
  label: string
  name: string
  value: string
  impliedValue?: YesNoValue
  impliedHint?: string
  disabled?: boolean
  onChange: (tagValue: string) => void
}) {
  const canClear = props.value !== '' && !props.disabled

  return (
    <div className="flex min-w-0 flex-col gap-0.5 text-xs">
      <div className="flex h-4 items-center gap-0.5">
        <span className="min-w-0 truncate text-zinc-600" title={props.name}>
          {props.label}
        </span>
        {canClear ? <TagEditorClearValueButton onClear={() => props.onChange('')} /> : null}
      </div>
      <YesNoOrTextInput
        name={props.name}
        value={props.value}
        impliedValue={props.impliedValue}
        impliedHint={props.impliedHint}
        disabled={props.disabled}
        onChange={props.onChange}
      />
    </div>
  )
}
