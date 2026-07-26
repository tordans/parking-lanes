import { TagEditorSelectInput } from '../../../../components/tag-editor'
import { type TagValue } from '../../../../utils/types/parking'
import { formatParkingTagValueLabel } from '../../domain/editor/format-tag-value-label'

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
      formatOptionLabel={formatParkingTagValueLabel}
      onChange={props.onChange}
    />
  )
}
