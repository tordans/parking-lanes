import clsx from 'clsx'
import {
  tagEditorCompactControlClassName,
  tagEditorValueButtonDividerClassName,
  tagEditorValueButtonGroupCompactClassName,
  tagEditorValueButtonImpliedClassName,
  tagEditorValueButtonSelectedClassName,
} from './tag-editor-controls'

const yesNoOptions = ['yes', 'no'] as const

export type YesNoValue = (typeof yesNoOptions)[number]

const baseButtonClassName = `flex shrink-0 cursor-pointer items-center justify-center disabled:cursor-not-allowed disabled:opacity-50 ${tagEditorCompactControlClassName}`

export function YesNoRadioInput(props: {
  name: string
  value: string
  /** When `value` is empty, softly highlight this option as the OSM-implied default. */
  impliedValue?: YesNoValue
  /** Tooltip / accessible description for the soft-selected default option. */
  impliedHint?: string
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
        const isImplied = props.value === '' && props.impliedValue === option
        const title = isSelected ? option : isImplied ? (props.impliedHint ?? option) : option

        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={option}
            aria-description={isImplied ? props.impliedHint : undefined}
            title={title}
            disabled={props.disabled}
            className={clsx(
              baseButtonClassName,
              'w-8',
              index > 0 && tagEditorValueButtonDividerClassName,
              isSelected
                ? tagEditorValueButtonSelectedClassName
                : isImplied
                  ? tagEditorValueButtonImpliedClassName
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
