import { type OsmWay } from '@osm-editor-kit/osm-data'
import {
  type ConditionalValue,
  buildConditionalTagValue,
  parseConditionalTagForEdit,
} from '@osm-editor-kit/osm-tag-syntax'
import { useState } from 'react'
import { Input } from '../../../../components/catalyst/input'
import { type TagValue } from '../../../../utils/types/parking'
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
      <td className="align-baseline max-sm:max-w-[30vw] max-sm:overflow-auto">
        <label
          title={props.tag}
          className="text-base/6 text-zinc-950 select-none sm:text-sm/6 dark:text-white"
        >
          {props.label}
        </label>
      </td>
      <td className="flex flex-col items-start gap-1 max-sm:max-w-[60vw] max-sm:overflow-auto">
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
    <div className="flex flex-nowrap gap-1.5">
      <div>
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
      <div className="flex flex-nowrap items-center gap-1.5">
        @
        <Input
          type="text"
          className="min-w-0 max-sm:max-w-[30vw]"
          placeholder="time interval"
          name={props.tag}
          value={condition ?? ''}
          onChange={(e) => handleChangeCondition(e.currentTarget.value)}
        />
      </div>
    </div>
  )
}
