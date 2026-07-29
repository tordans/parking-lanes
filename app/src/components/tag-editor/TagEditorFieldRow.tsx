import type { ReactNode } from 'react'
import {
  tagEditorLabelCellClassName,
  tagEditorLabelClassName,
  tagEditorValueRowClassName,
} from './tag-editor-controls'
import { TagEditorClearValueButton } from './TagEditorClearValueButton'

export function TagEditorFieldRow(props: {
  tag: string
  label: string
  id?: string
  hide?: boolean
  hasValue?: boolean
  /** When set, shows a small (x) next to the label to clear the value. */
  onClear?: () => void
  clearDisabled?: boolean
  children: ReactNode
}) {
  const showClear = props.onClear != null && props.hasValue && !props.clearDisabled

  return (
    <tr
      id={props.id ?? props.tag}
      className="tag-editor"
      style={{ display: props.hide && !props.hasValue ? 'none' : undefined }}
    >
      <td className={tagEditorLabelCellClassName}>
        <div className={`${tagEditorLabelClassName} flex h-5 items-center gap-0.5`}>
          <label title={props.tag} className="min-w-0 truncate">
            {props.label}
          </label>
          {showClear ? <TagEditorClearValueButton onClear={props.onClear!} /> : null}
        </div>
      </td>
      <td className={tagEditorValueRowClassName}>{props.children}</td>
    </tr>
  )
}
