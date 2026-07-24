import { Select } from '../../../../components/catalyst/select'
import { type TagValue } from '../../../../utils/types/parking'
import { tagEditorFieldClassName } from './tag-editor-controls'

export function SelectInput(props: {
  tag: string
  value: string
  values: TagValue[]
  disabled?: boolean
  onChange: (tagValue: string) => void
}) {
  const values = props.values.map((v) => v.value)
  const options =
    !props.value || values.includes(props.value) ? ['', ...values] : ['', props.value, ...values]

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
          {o}
        </option>
      ))}
    </Select>
  )
}
