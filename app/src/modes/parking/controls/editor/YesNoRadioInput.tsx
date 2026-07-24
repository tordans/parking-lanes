import clsx from 'clsx'
import { Tooltip } from '../../../../components/Tooltip/Tooltip'
import {
  tagEditorValueButtonDividerClassName,
  tagEditorValueButtonGroupCompactClassName,
  tagEditorValueButtonSelectedClassName,
  tagEditorYesNoButtonClassName,
} from './tag-editor-controls'

const yesNoOptions = ['yes', 'no'] as const

export function YesNoRadioInput(props: {
  name: string
  value: string
  disabled?: boolean
  onChange: (tagValue: string) => void
}) {
  return (
    <div
      className={tagEditorValueButtonGroupCompactClassName}
      role="radiogroup"
      aria-label={props.name}
    >
      {yesNoOptions.map((option, index) => {
        const isSelected = props.value === option
        const button = (
          <button
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={option}
            title={option}
            disabled={props.disabled}
            className={clsx(
              tagEditorYesNoButtonClassName,
              index > 0 && tagEditorValueButtonDividerClassName,
              isSelected && tagEditorValueButtonSelectedClassName,
            )}
            onClick={() => props.onChange(option)}
          >
            {option}
          </button>
        )

        return (
          <Tooltip key={option} content={option} wrapperClassName="shrink-0">
            {button}
          </Tooltip>
        )
      })}
    </div>
  )
}
