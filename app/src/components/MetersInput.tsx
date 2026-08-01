import clsx from 'clsx'
import type { ComponentPropsWithoutRef } from 'react'

export type MetersInputProps = {
  value: string
  onChange?: (value: string) => void
  disabled?: boolean
  readOnly?: boolean
  id?: string
  name?: string
  placeholder?: string
  /** Extra classes on the outer glued control. */
  className?: string
  /** Extra classes on the value field (e.g. calculated purple). */
  valueClassName?: string
  /** Extra classes on the unit suffix. */
  unitClassName?: string
  'aria-label'?: string
  'aria-labelledby'?: string
} & Omit<
  ComponentPropsWithoutRef<'input'>,
  | 'value'
  | 'onChange'
  | 'disabled'
  | 'readOnly'
  | 'id'
  | 'name'
  | 'placeholder'
  | 'className'
  | 'type'
>

/**
 * Compact metres field with a glued `m` suffix (shared form control).
 * Use for OSM width-style tags and read-only metre summaries.
 */
export function MetersInput({
  value,
  onChange,
  disabled,
  readOnly,
  id,
  name,
  placeholder,
  className,
  valueClassName,
  unitClassName,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  ...inputProps
}: MetersInputProps) {
  return (
    <div
      className={clsx(
        'flex min-w-0 overflow-hidden rounded border border-zinc-300 bg-white',
        (disabled || readOnly) && 'bg-zinc-50',
        className,
      )}
    >
      <input
        {...inputProps}
        id={id}
        name={name}
        type="text"
        inputMode="decimal"
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        onChange={(event) => onChange?.(event.target.value)}
        className={clsx(
          'min-w-0 flex-1 border-0 bg-transparent px-1.5 py-1 text-sm outline-none',
          'disabled:cursor-not-allowed disabled:bg-transparent',
          'read-only:cursor-default',
          valueClassName,
        )}
      />
      <span
        className={clsx(
          'flex shrink-0 items-center border-l border-zinc-300 bg-zinc-50 px-1.5 text-xs text-zinc-500 select-none',
          unitClassName,
        )}
        aria-hidden
      >
        m
      </span>
    </div>
  )
}
