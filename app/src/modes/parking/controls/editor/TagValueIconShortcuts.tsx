import clsx from 'clsx'
import { Tooltip } from '../../../../components/Tooltip/Tooltip'
import { type TagValue } from '../../../../utils/types/parking'
import { formatParkingTagValueLabel } from '../../domain/editor/format-tag-value-label'
import {
  tagEditorValueButtonCompactClassName,
  tagEditorValueButtonDividerClassName,
  tagEditorValueButtonGroupCompactClassName,
  tagEditorValueButtonIconCompactClassName,
  tagEditorValueButtonSelectedClassName,
} from './tag-editor-controls'

export function TagValueIconShortcuts(props: {
  value: string | undefined
  values: TagValue[]
  disabled?: boolean
  onChange: (tagValue: string) => void
}) {
  const iconValues = props.values.filter((entry) => entry.imgSrc)
  if (iconValues.length === 0) return null

  const value = props.value ?? ''

  return (
    <div
      className={tagEditorValueButtonGroupCompactClassName}
      role="group"
      aria-label="Icon shortcuts"
    >
      {iconValues.map((option, index) => {
        const isSelected = option.value === value
        const button = (
          <button
            type="button"
            aria-label={option.value}
            title={option.value}
            aria-pressed={isSelected}
            disabled={props.disabled}
            className={clsx(
              tagEditorValueButtonCompactClassName,
              index > 0 && tagEditorValueButtonDividerClassName,
              isSelected && tagEditorValueButtonSelectedClassName,
            )}
            onClick={() => props.onChange(option.value)}
          >
            <img src={option.imgSrc} alt="" className={tagEditorValueButtonIconCompactClassName} />
          </button>
        )

        return (
          <Tooltip
            key={option.value}
            content={formatParkingTagValueLabel(option.value)}
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
