import { Input } from '../catalyst/input'
import { tagEditorFieldClassName } from './tag-editor-controls'

export function TagEditorTextInput(props: {
  tag: string
  value: string
  disabled?: boolean
  onChange: (tagValue: string) => void
}) {
  return (
    <Input
      type="text"
      className={tagEditorFieldClassName}
      placeholder={props.tag}
      name={props.tag}
      value={props.value ?? ''}
      disabled={props.disabled}
      onChange={(e) => props.onChange(e.target.value)}
    />
  )
}
