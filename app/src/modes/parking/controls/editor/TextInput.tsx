import { Input } from '../../../../components/catalyst/input'

export function TextInput(props: {
  tag: string
  value: string
  disabled?: boolean
  onChange: (tagValue: string) => void
}) {
  return (
    <Input
      type="text"
      className="min-w-0"
      placeholder={props.tag}
      name={props.tag}
      value={props.value ?? ''}
      disabled={props.disabled}
      onChange={(e) => props.onChange(e.target.value)}
    />
  )
}
