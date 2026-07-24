import clsx from 'clsx'
import type { ReactElement } from 'react'
import { Children, cloneElement } from 'react'

const placementClasses = {
  top: 'bottom-full left-1/2 -translate-x-1/2 -translate-y-0.5 mb-0.5',
  bottom: 'top-full left-1/2 -translate-x-1/2 translate-y-0.5 mt-0.5',
  left: 'right-full top-1/2 -translate-y-1/2 -translate-x-0.5 mr-0.5',
  right: 'left-full top-1/2 -translate-y-1/2 translate-x-0.5 ml-0.5',
} as const

type Placement = keyof typeof placementClasses

type Props = {
  content: string | null | undefined
  placement?: Placement
  children: ReactElement<{ className?: string; title?: string }>
}

export function Tooltip({ content, placement = 'top', children }: Props) {
  if (content === undefined || content === null || content === '') {
    return children
  }

  const child = Children.only(children)
  const trigger = cloneElement(child, {
    className: clsx('peer inline-flex', child.props.className),
    title: undefined,
  })

  return (
    <span className="relative inline-flex">
      {trigger}
      <span
        role="tooltip"
        className={clsx(
          'pointer-events-none absolute z-50 hidden w-max max-w-50 rounded bg-zinc-800 px-2 py-1 text-xs text-zinc-100',
          'peer-hover:block peer-focus-visible:block',
          placementClasses[placement],
        )}
      >
        {content}
      </span>
    </span>
  )
}
