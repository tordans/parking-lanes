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
  isYesNoTagValues,
  tagEditorConditionalConditionGroupClassName,
  tagEditorConditionalConditionInputClassName,
  tagEditorConditionalConditionPrefixClassName,
  tagEditorLabelCellClassName,
  tagEditorLabelClassName,
  tagEditorValueStackClassName,
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
        {parsedConditionalTag.map((part, index) => (
          <ConditionalPartInput
            key={index}
            tag={props.tag}
            part={part}
            values={props.values}
            readOnly={readOnly}
            onChange={(updatedPart) =>
              props.onChange(buildConditionalTagValue(parsedConditionalTag, updatedPart, index))
            }
          />
        ))}
      </td>
    </tr>
  )
}

/**
 * Incomplete value/@ pairs stay local until both sides are set (OSM conditional
 * syntax requires both). Committed parts stay controlled from `part`.
 */
function ConditionalPartInput(props: {
  tag: string
  part: ConditionalValue
  values?: TagValue[]
  readOnly?: boolean
  onChange: (tagValuePart: ConditionalValue) => void
}) {
  const readOnly = props.readOnly ?? false
  const isComplete = Boolean(props.part.value && props.part.condition)
  const [draft, setDraft] = useState<ConditionalValue | null>(null)

  const active = draft ?? props.part
  const value = active.value
  const condition = active.condition

  function publish(next: ConditionalValue) {
    if (next.value && next.condition) {
      setDraft(null)
      props.onChange(next)
      return
    }
    setDraft(next)
  }

  function handleChangeValue(newValue: string) {
    if (readOnly) return
    publish({ value: newValue, condition })
  }

  function handleChangeCondition(newCondition: string) {
    if (readOnly) return
    publish({ value, condition: newCondition })
  }

  // Drop local draft once the parent draft/session has caught up with a complete part.
  if (
    draft &&
    isComplete &&
    draft.value === props.part.value &&
    draft.condition === props.part.condition
  ) {
    setDraft(null)
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
