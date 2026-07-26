import { type OsmWay } from '@osm-editor-kit/osm-data'
import {
  TagEditorFieldRow,
  TagEditorTextInput,
  tagEditorValueCellClassName,
} from '../../../../components/tag-editor'
import { type TagValue } from '../../../../utils/types/parking'
import { usesParkingPositionButtonGroup } from './tag-editor-controls'
import { TagValueButtonGroup } from './TagValueButtonGroup'
import { TagValueInput } from './TagValueInput'

export function SimpleTagInput(props: {
  osm: OsmWay
  tag: string
  label: string
  hide: boolean
  readOnly?: boolean
  values?: TagValue[]
  onChange: (value: string) => void
}) {
  const value = props.osm.tags[props.tag]
  const readOnly = props.readOnly ?? false
  const useParkingPositionLayout = props.values != null && usesParkingPositionButtonGroup(props.tag)

  if (useParkingPositionLayout) {
    return (
      <tr
        id={props.tag}
        className="tag-editor"
        style={{ display: props.hide && !value ? 'none' : undefined }}
      >
        <td colSpan={2} className={`${tagEditorValueCellClassName} py-0`}>
          <TagValueButtonGroup
            value={value ?? ''}
            values={props.values!}
            disabled={readOnly}
            ariaLabel={props.tag}
            onChange={props.onChange}
          />
        </td>
      </tr>
    )
  }

  return (
    <TagEditorFieldRow tag={props.tag} label={props.label} hide={props.hide} hasValue={!!value}>
      {props.values ? (
        <TagValueInput
          tag={props.tag}
          value={value}
          values={props.values}
          disabled={readOnly}
          onChange={props.onChange}
        />
      ) : (
        <TagEditorTextInput
          tag={props.tag}
          value={value ?? ''}
          disabled={readOnly}
          onChange={props.onChange}
        />
      )}
    </TagEditorFieldRow>
  )
}
