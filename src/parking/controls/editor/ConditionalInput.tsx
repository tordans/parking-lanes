import { useState } from 'react'
import { type ConditionalValue } from '../../../utils/conditional-tag'
import { type OsmWay } from '../../../utils/types/osm-data'
import { type TagValue } from '../../../utils/types/parking'
import {
  buildConditionalTagValue,
  parseConditionalTagForEdit,
} from '../../domain/editor/conditional-tag-edit'
import { SelectInput } from './SelectInput'
import { TextInput } from './TextInput'

export function ConditionalInput(props: {
  osm: OsmWay
  tag: string
  label: string
  hide: boolean
  values?: TagValue[]
  onChange: (tagValue: string) => void
}) {
  const parsedConditionalTag = parseConditionalTagForEdit(props.osm.tags[props.tag])

  const buildTagValue = (newConditionalValue: ConditionalValue, index: number) => {
    return buildConditionalTagValue(parsedConditionalTag, newConditionalValue, index)
  }

  return (
    <tr id={props.tag} className="tag-editor" style={{ display: props.hide ? 'none' : undefined }}>
      <td className="tag-editor__key">
        <label title={props.tag}>{props.label}</label>
      </td>
      <td className="tag-editor__inputs tag-editor__inputs--conditional">
        {parsedConditionalTag.map((conditionalValue, index) => (
          <ConditionalPartInput
            key={index}
            tag={props.tag}
            part={conditionalValue}
            values={props.values}
            onChange={(vp) => props.onChange(buildTagValue(vp, index))}
          />
        ))}
      </td>
    </tr>
  )
}

function ConditionalPartInput(props: {
  tag: string
  part: ConditionalValue
  values?: TagValue[]
  onChange: (tagValuePart: ConditionalValue) => void
}) {
  const [value, setValue] = useState(props.part.value)
  const [condition, setCondition] = useState(props.part.condition)

  const handleChangeValue = (newValue: string) => {
    setValue(newValue)
    if (newValue && condition) props.onChange({ value: newValue, condition })
  }

  const handleChangeCondition = (newCondition: string) => {
    setCondition(newCondition)
    if (value && newCondition) props.onChange({ value, condition: newCondition })
  }

  return (
    <div className="conditional-tag-part">
      <div className="conditional-tag-part__value">
        {props.values ? (
          <SelectInput
            tag={props.tag}
            value={value}
            values={props.values}
            onChange={handleChangeValue}
          />
        ) : (
          <TextInput tag={props.tag} value={value} onChange={handleChangeValue} />
        )}
      </div>
      <div className="conditional-tag-part__condition">
        @
        <input
          type="text"
          placeholder="time interval"
          name={props.tag}
          value={condition ?? undefined}
          onChange={(e) => handleChangeCondition(e.currentTarget.value)}
        />
      </div>
    </div>
  )
}
