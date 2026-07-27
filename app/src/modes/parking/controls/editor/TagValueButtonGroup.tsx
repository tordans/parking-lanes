import * as m from '@app/paraglide/messages'
import clsx from 'clsx'
import { Tooltip } from '../../../../components/Tooltip/Tooltip'
import { type TagValue } from '../../../../utils/types/parking'
import { formatParkingTagValueLabel } from '../../domain/editor/format-tag-value-label'
import {
  tagEditorParkingPositionButtonClassName,
  tagEditorValueButtonDividerClassName,
  tagEditorValueButtonGroupClassName,
  tagEditorValueButtonIconClassName,
  tagEditorValueButtonSelectedClassName,
} from './tag-editor-controls'

function tagValueOptions(value: string, values: TagValue[]): TagValue[] {
  if (value && !values.some((entry) => entry.value === value)) {
    return [{ value }, ...values]
  }

  return values
}

/** Segmented icon bar for `parking:both|left|right` only. */
export function TagValueButtonGroup(props: {
  value: string
  values: TagValue[]
  disabled?: boolean
  ariaLabel?: string
  className?: string
  onChange: (tagValue: string) => void
}) {
  const options = tagValueOptions(props.value, props.values)
  const buttons: { key: string; label: string; imgSrc?: string; value: string }[] = [
    { key: '__clear__', label: m.editor_clear_value(), value: '' },
    ...options.map((option) => ({
      key: option.value,
      label: formatParkingTagValueLabel(option.value),
      imgSrc: option.imgSrc,
      value: option.value,
    })),
  ]

  return (
    <div
      className={clsx(tagEditorValueButtonGroupClassName, props.className)}
      role="group"
      aria-label={props.ariaLabel ?? 'Parking position'}
    >
      {buttons.map((option, index) => {
        const isSelected = option.value === props.value
        const button = (
          <button
            type="button"
            aria-label={option.value || m.editor_clear_value()}
            title={option.label}
            aria-pressed={isSelected}
            disabled={props.disabled}
            className={clsx(
              tagEditorParkingPositionButtonClassName,
              index > 0 && tagEditorValueButtonDividerClassName,
              isSelected && tagEditorValueButtonSelectedClassName,
            )}
            onClick={() => props.onChange(option.value)}
          >
            {option.key === '__clear__' ? (
              <span className="px-0.5 text-sm leading-none text-zinc-400">—</span>
            ) : option.imgSrc ? (
              <img src={option.imgSrc} alt="" className={tagEditorValueButtonIconClassName} />
            ) : (
              <span className="max-w-full truncate px-0.5 font-mono text-[10px] leading-tight">
                {option.value}
              </span>
            )}
          </button>
        )

        return (
          <Tooltip
            key={option.key}
            content={option.label}
            placement="top"
            wrapperClassName="shrink-0"
          >
            {button}
          </Tooltip>
        )
      })}
    </div>
  )
}
