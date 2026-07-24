import { Select } from '../../../../components/catalyst/select'
import { type TagValue } from '../../../../utils/types/parking'

export function SelectInput(props: {
  tag: string
  value: string
  values: TagValue[]
  onChange: (tagValue: string) => void
}) {
  const values = props.values.map((v) => v.value)
  const options =
    !props.value || values.includes(props.value) ? ['', ...values] : ['', props.value, ...values]

  return (
    <Select
      name={props.tag}
      value={props.value}
      className="min-w-0"
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
