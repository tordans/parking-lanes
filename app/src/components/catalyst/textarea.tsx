import * as Headless from '@headlessui/react'
import clsx from 'clsx'
import React, { forwardRef } from 'react'

export const Textarea = forwardRef(function Textarea(
  {
    className,
    resizable = true,
    ...props
  }: { className?: string; resizable?: boolean } & Omit<Headless.TextareaProps, 'as' | 'className'>,
  ref: React.ForwardedRef<HTMLTextAreaElement>,
) {
  return (
    <span
      data-slot="control"
      className={clsx([
        className,
        'relative block w-full',
        'before:absolute before:inset-px before:rounded-[calc(var(--radius-md)-1px)] before:bg-white before:shadow-sm',
        'after:pointer-events-none after:absolute after:inset-0 after:rounded-md after:ring-transparent after:ring-inset sm:focus-within:after:ring-2 sm:focus-within:after:ring-blue-500',
        'has-data-disabled:opacity-50 has-data-disabled:before:bg-zinc-950/5 has-data-disabled:before:shadow-none',
      ])}
    >
      <Headless.Textarea
        ref={ref}
        {...props}
        className={clsx([
          'relative block h-full w-full appearance-none rounded-md px-[calc(--spacing(3.5)-1px)] py-[calc(--spacing(2.5)-1px)] sm:px-[calc(--spacing(3)-1px)] sm:py-[calc(--spacing(1.5)-1px)]',
          'text-base/6 text-zinc-950 placeholder:text-zinc-500 sm:text-sm/6',
          'border border-zinc-950/10 data-hover:border-zinc-950/20',
          'bg-transparent',
          'focus:outline-hidden',
          'data-invalid:border-red-500 data-invalid:data-hover:border-red-500',
          'disabled:border-zinc-950/20',
          resizable ? 'resize-y' : 'resize-none',
        ])}
      />
    </span>
  )
})
