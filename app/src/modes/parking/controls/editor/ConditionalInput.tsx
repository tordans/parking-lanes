import { type OsmWay } from '@osm-editor-kit/osm-data'
import {
  type ConditionalValue,
  buildConditionalTagValue,
  parseConditionalTagForEdit,
} from '@osm-editor-kit/osm-tag-syntax'
import clsx from 'clsx'
import { useState } from 'react'
import { Textarea } from '../../../../components/catalyst/textarea'
import { type TagValue } from '../../../../utils/types/parking'
import {
  tagEditorConditionalConditionGroupClassName,
  tagEditorConditionalConditionInputClassName,
  tagEditorConditionalConditionPrefixClassName,
  tagEditorLabelCellClassName,
  tagEditorLabelClassName,
  tagEditorValueStackClassName,
  isYesNoTagValues,
} from './tag-editor-controls'
import { TagValueInput } from './TagValueInput'
import { TextInput } from './TextInput'

export function ConditionalInput(props: {
  osm: OsmWay
  tag: string
  label: string
  hide: boolean
  readOnly?: boolean
  values?: TagValue[]
  onChange: (tagValue: string) => void
}) {
  const readOnly = props.readOnly ?? false
  const parsedConditionalTag = parseConditionalTagForEdit(props.osm.tags[props.tag])
  const conditionalValue = props.osm.tags[props.tag]

  const buildTagValue = (newConditionalValue: ConditionalValue, index: number) => {
    return buildConditionalTagValue(parsedConditionalTag, newConditionalValue, index)
  }

  return (
    <tr
      id={props.tag}
      className="tag-editor"
      style={{ display: props.hide && !conditionalValue ? 'none' : undefined }}
    >
      <td className={tagEditorLabelCellClassName}>
        <label title={props.tag} className={tagEditorLabelClassName}>
          {props.label}
        </label>
      </td>
      <td className={tagEditorValueStackClassName}>
        {parsedConditionalTag.map((conditionalValue, index) => (
          <ConditionalPartInput
            key={index}
            tag={props.tag}
            part={conditionalValue}
            values={props.values}
            readOnly={readOnly}
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
  readOnly?: boolean
  onChange: (tagValuePart: ConditionalValue) => void
}) {
  const readOnly = props.readOnly ?? false
  const [value, setValue] = useState(props.part.value)
  const [condition, setCondition] = useState(props.part.condition)

  const handleChangeValue = (newValue: string) => {
    if (readOnly) return
    setValue(newValue)
    if (newValue && condition) props.onChange({ value: newValue, condition })
  }

  const handleChangeCondition = (newCondition: string) => {
    if (readOnly) return
    setCondition(newCondition)
    if (value && newCondition) props.onChange({ value, condition: newCondition })
  }

  const isYesNo = props.values != null && isYesNoTagValues(props.values)
  const showConditionInput = value !== ''

  return (
    <div className="flex w-full min-w-0 flex-col items-stretch gap-1">
      <div className={clsx('min-w-0', isYesNo ? 'shrink-0' : 'w-full')}>
        {props.values ? (
          <TagValueInput
            tag={props.tag}
            value={value}
            values={props.values}
            disabled={readOnly}
            iconShortcuts={false}
            onChange={handleChangeValue}
          />
        ) : (
          <TextInput
            tag={props.tag}
            value={value}
            disabled={readOnly}
            onChange={handleChangeValue}
          />
        )}
      </div>
      {showConditionInput ? (
        <div className={tagEditorConditionalConditionGroupClassName}>
          <span className={tagEditorConditionalConditionPrefixClassName}>@</span>
          <Textarea
            rows={1}
            resizable={false}
            className={tagEditorConditionalConditionInputClassName}
            placeholder="time interval"
            name={props.tag}
            value={condition ?? ''}
            disabled={readOnly}
            ref={adjustTextareaHeight}
            onChange={(e) => {
              handleChangeCondition(e.currentTarget.value.replaceAll('\n', ' '))
              adjustTextareaHeight(e.currentTarget)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.preventDefault()
            }}
          />
        </div>
      ) : null}
    </div>
  )
}

function adjustTextareaHeight(el: HTMLTextAreaElement | null) {
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${el.scrollHeight}px`
}
