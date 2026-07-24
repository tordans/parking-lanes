import { type OsmWay } from '@osm-editor-kit/osm-data'
import { type TagValue } from '../../../../utils/types/parking'
import {
  tagEditorLabelCellClassName,
  tagEditorLabelClassName,
  tagEditorValueCellClassName,
  tagEditorValueRowClassName,
  usesParkingPositionButtonGroup,
} from './tag-editor-controls'
import { TagValueButtonGroup } from './TagValueButtonGroup'
import { TagValueInput } from './TagValueInput'
import { TextInput } from './TextInput'

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

  return (
    <tr
      id={props.tag}
      className="tag-editor"
      style={{ display: props.hide && !value ? 'none' : undefined }}
    >
      {useParkingPositionLayout ? (
        <td colSpan={2} className={`${tagEditorValueCellClassName} py-0`}>
          <TagValueButtonGroup
            value={value ?? ''}
            values={props.values!}
            disabled={readOnly}
            ariaLabel={props.tag}
            onChange={props.onChange}
          />
        </td>
      ) : (
        <>
          <td className={tagEditorLabelCellClassName}>
            <label title={props.tag} className={tagEditorLabelClassName}>
              {props.label}
            </label>
          </td>
          <td className={tagEditorValueRowClassName}>
            {props.values ? (
              <TagValueInput
                tag={props.tag}
                value={value}
                values={props.values}
                disabled={readOnly}
                onChange={props.onChange}
              />
            ) : (
              <TextInput
                tag={props.tag}
                value={value}
                disabled={readOnly}
                onChange={props.onChange}
              />
            )}
          </td>
        </>
      )}
    </tr>
  )
}
