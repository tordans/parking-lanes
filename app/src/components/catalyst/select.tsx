import * as Headless from '@headlessui/react'
import clsx from 'clsx'
import React, { forwardRef } from 'react'

export const Select = forwardRef(function Select(
  {
    className,
    multiple,
    ...props
  }: { className?: string } & Omit<Headless.SelectProps, 'as' | 'className'>,
  ref: React.ForwardedRef<HTMLSelectElement>,
) {
  return (
    <span
      data-slot="control"
      className={clsx([
        className,
        'group relative block w-full',
        'before:absolute before:inset-px before:rounded-[calc(var(--radius-md)-1px)] before:bg-white before:shadow-sm',
        'after:pointer-events-none after:absolute after:inset-0 after:rounded-md after:ring-transparent after:ring-inset has-data-focus:after:ring-2 has-data-focus:after:ring-blue-500',
        'has-data-disabled:opacity-50 has-data-disabled:before:bg-zinc-950/5 has-data-disabled:before:shadow-none',
      ])}
    >
      <Headless.Select
        ref={ref}
        multiple={multiple}
        {...props}
        className={clsx([
          'relative block w-full appearance-none rounded-md py-[calc(--spacing(2.5)-1px)] sm:py-[calc(--spacing(1.5)-1px)]',
          multiple
            ? 'px-[calc(--spacing(3.5)-1px)] sm:px-[calc(--spacing(3)-1px)]'
            : 'pr-[calc(--spacing(10)-1px)] pl-[calc(--spacing(3.5)-1px)] sm:pr-[calc(--spacing(9)-1px)] sm:pl-[calc(--spacing(3)-1px)]',
          '[&_optgroup]:font-semibold',
          'text-base/6 text-zinc-950 placeholder:text-zinc-500 sm:text-sm/6',
          'border border-zinc-950/10 data-hover:border-zinc-950/20',
          'bg-transparent',
          'focus:outline-hidden',
          'data-invalid:border-red-500 data-invalid:data-hover:border-red-500',
          'data-disabled:border-zinc-950/20 data-disabled:opacity-100',
        ])}
      />
      {!multiple && (
        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
          <svg
            className="size-5 stroke-zinc-500 group-has-data-disabled:stroke-zinc-600 sm:size-4 forced-colors:stroke-[CanvasText]"
            viewBox="0 0 16 16"
            aria-hidden="true"
            fill="none"
          >
            <path
              d="M5.75 10.75L8 13L10.25 10.75"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M10.25 5.25L8 3L5.75 5.25"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      )}
    </span>
  )
})
