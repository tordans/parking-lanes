import * as Headless from '@headlessui/react'
import clsx from 'clsx'
import type React from 'react'
import { Button } from './button'

function MenuButton(props: React.ComponentProps<'button'>) {
  return <button type="button" {...props} />
}

export function Dropdown(props: Headless.MenuProps) {
  return <Headless.Menu {...props} />
}

export function DropdownButton<T extends React.ElementType = typeof Button>({
  as = Button,
  ...props
}: { className?: string } & Omit<Headless.MenuButtonProps<T>, 'className'>) {
  return <Headless.MenuButton as={as} {...props} />
}

export function DropdownMenu({
  anchor = 'bottom',
  className,
  ...props
}: { className?: string } & Omit<Headless.MenuItemsProps, 'as' | 'className'>) {
  return (
    <Headless.MenuItems
      {...props}
      transition
      anchor={anchor}
      className={clsx(
        className,
        '[--anchor-gap:--spacing(2)] [--anchor-padding:--spacing(1)] data-[anchor~=end]:[--anchor-offset:6px] data-[anchor~=start]:[--anchor-offset:-6px] sm:data-[anchor~=end]:[--anchor-offset:4px] sm:data-[anchor~=start]:[--anchor-offset:-4px]',
        'isolate w-max rounded-xl p-1',
        'outline outline-transparent focus:outline-hidden',
        'overflow-y-auto',
        'bg-white/75 backdrop-blur-xl dark:bg-zinc-800/75',
        'shadow-lg ring-1 ring-zinc-950/10 dark:ring-white/10 dark:ring-inset',
        'supports-[grid-template-columns:subgrid]:grid supports-[grid-template-columns:subgrid]:grid-cols-[auto_1fr_1.5rem_0.5rem_auto]',
        'transition data-leave:duration-100 data-leave:ease-in data-closed:data-leave:opacity-0',
      )}
    />
  )
}

export function DropdownItem({
  className,
  ...props
}: { className?: string } & Omit<Headless.MenuItemProps<'button'>, 'as' | 'className'>) {
  const classes = clsx(
    className,
    'group cursor-default rounded-lg px-3.5 py-2.5 focus:outline-hidden sm:px-3 sm:py-1.5',
    'text-left text-base/6 text-zinc-950 sm:text-sm/6 dark:text-white forced-colors:text-[CanvasText]',
    'data-focus:bg-blue-500 data-focus:text-white',
    'data-disabled:opacity-50',
    'forced-color-adjust-none forced-colors:data-focus:bg-[Highlight] forced-colors:data-focus:text-[HighlightText] forced-colors:data-focus:*:data-[slot=icon]:text-[HighlightText]',
    'col-span-full grid grid-cols-[auto_1fr_1.5rem_0.5rem_auto] items-center supports-[grid-template-columns:subgrid]:grid-cols-subgrid',
    '*:data-[slot=icon]:col-start-1 *:data-[slot=icon]:row-start-1 *:data-[slot=icon]:mr-2.5 *:data-[slot=icon]:-ml-0.5 *:data-[slot=icon]:size-5 sm:*:data-[slot=icon]:mr-2 sm:*:data-[slot=icon]:size-4',
    '*:data-[slot=icon]:text-zinc-500 data-focus:*:data-[slot=icon]:text-white dark:*:data-[slot=icon]:text-zinc-400 dark:data-focus:*:data-[slot=icon]:text-white',
    '*:data-[slot=avatar]:mr-2.5 *:data-[slot=avatar]:-ml-1 *:data-[slot=avatar]:size-6 sm:*:data-[slot=avatar]:mr-2 sm:*:data-[slot=avatar]:size-5',
  )

  return <Headless.MenuItem as={MenuButton} {...props} className={classes} />
}

export function DropdownHeader({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  return <div {...props} className={clsx(className, 'col-span-5 px-3.5 pt-2.5 pb-1 sm:px-3')} />
}

export function DropdownSection({
  className,
  ...props
}: { className?: string } & Omit<Headless.MenuSectionProps, 'as' | 'className'>) {
  return (
    <Headless.MenuSection
      {...props}
      className={clsx(
        className,
        'col-span-full supports-[grid-template-columns:subgrid]:grid supports-[grid-template-columns:subgrid]:grid-cols-[auto_1fr_1.5rem_0.5rem_auto]',
      )}
    />
  )
}

export function DropdownHeading({
  className,
  ...props
}: { className?: string } & Omit<Headless.MenuHeadingProps, 'as' | 'className'>) {
  return (
    <Headless.MenuHeading
      {...props}
      className={clsx(
        className,
        'col-span-full grid grid-cols-[1fr_auto] gap-x-12 px-3.5 pt-2 pb-1 text-sm/5 font-medium text-zinc-500 sm:px-3 sm:text-xs/5 dark:text-zinc-400',
      )}
    />
  )
}

export function DropdownDivider({
  className,
  ...props
}: { className?: string } & Omit<Headless.MenuSeparatorProps, 'as' | 'className'>) {
  return (
    <Headless.MenuSeparator
      {...props}
      className={clsx(
        className,
        'col-span-full mx-3.5 my-1 h-px border-0 bg-zinc-950/5 sm:mx-3 dark:bg-white/10 forced-colors:bg-[CanvasText]',
      )}
    />
  )
}

export function DropdownLabel({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  return <div {...props} data-slot="label" className={clsx(className, 'col-start-2 row-start-1')} />
}
