import { Select } from '../catalyst/select'
import { tagEditorFieldClassName } from './tag-editor-controls'

export function TagEditorSelectInput(props: {
  tag: string
  value: string
  values: readonly string[]
  disabled?: boolean
  formatOptionLabel?: (value: string) => string
  onChange: (tagValue: string) => void
}) {
  const options =
    !props.value || props.values.includes(props.value)
      ? ['', ...props.values]
      : ['', props.value, ...props.values]

  return (
    <Select
      name={props.tag}
      value={props.value}
      className={tagEditorFieldClassName}
      disabled={props.disabled}
      onChange={(e) => props.onChange(e.target.value)}
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {props.formatOptionLabel ? props.formatOptionLabel(o) : o}
        </option>
      ))}
    </Select>
  )
}
