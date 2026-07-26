import { TagEditorSelectInput } from '../../../../components/tag-editor'
import { type TagValue } from '../../../../utils/types/parking'

export function SelectInput(props: {
  tag: string
  value: string
  values: TagValue[]
  disabled?: boolean
  onChange: (tagValue: string) => void
}) {
  return (
    <TagEditorSelectInput
      tag={props.tag}
      value={props.value}
      values={props.values.map((v) => v.value)}
      disabled={props.disabled}
      onChange={props.onChange}
    />
  )
}
