import clsx from 'clsx'
import {
  tagEditorCompactControlClassName,
  tagEditorValueButtonDividerClassName,
  tagEditorValueButtonGroupCompactClassName,
  tagEditorValueButtonSelectedClassName,
} from './tag-editor-controls'

const yesNoOptions = ['yes', 'no'] as const

const baseButtonClassName = `flex shrink-0 cursor-pointer items-center justify-center disabled:cursor-not-allowed disabled:opacity-50 ${tagEditorCompactControlClassName}`

export function YesNoRadioInput(props: {
  name: string
  value: string
  disabled?: boolean
  onChange: (tagValue: string) => void
}) {
  return (
    <div
      className={clsx(tagEditorValueButtonGroupCompactClassName, 'w-fit max-w-full')}
      role="radiogroup"
      aria-label={props.name}
    >
      {yesNoOptions.map((option, index) => {
        const isSelected = props.value === option
        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={option}
            title={option}
            disabled={props.disabled}
            className={clsx(
              baseButtonClassName,
              'w-8',
              index > 0 && tagEditorValueButtonDividerClassName,
              isSelected
                ? tagEditorValueButtonSelectedClassName
                : 'bg-white text-zinc-700 hover:bg-zinc-50 active:bg-zinc-100',
            )}
            onClick={() => props.onChange(option)}
          >
            {option}
          </button>
        )
      })}
    </div>
  )
}
