import type { ReactNode } from 'react'
import {
  tagEditorLabelCellClassName,
  tagEditorLabelClassName,
  tagEditorValueRowClassName,
} from './tag-editor-controls'

export function TagEditorFieldRow(props: {
  tag: string
  label: string
  id?: string
  hide?: boolean
  hasValue?: boolean
  children: ReactNode
}) {
  return (
    <tr
      id={props.id ?? props.tag}
      className="tag-editor"
      style={{ display: props.hide && !props.hasValue ? 'none' : undefined }}
    >
      <td className={tagEditorLabelCellClassName}>
        <label title={props.tag} className={`${tagEditorLabelClassName} flex h-5 items-center`}>
          {props.label}
        </label>
      </td>
      <td className={tagEditorValueRowClassName}>{props.children}</td>
    </tr>
  )
}
