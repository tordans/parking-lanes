import clsx from 'clsx'
import type { CSSProperties, ReactElement, ReactNode } from 'react'
import { Children, cloneElement, useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

type Placement = 'top' | 'bottom' | 'left' | 'right'

type Props = {
  content: ReactNode | null | undefined
  placement?: Placement
  wrapperClassName?: string
  children: ReactElement<{ className?: string; title?: string }>
}

function tooltipStyle(rect: DOMRect, placement: Placement): CSSProperties {
  const gap = 6

  switch (placement) {
    case 'top':
      return {
        position: 'fixed',
        top: rect.top - gap,
        left: rect.left + rect.width / 2,
        transform: 'translate(-50%, -100%)',
      }
    case 'bottom':
      return {
        position: 'fixed',
        top: rect.bottom + gap,
        left: rect.left + rect.width / 2,
        transform: 'translate(-50%, 0)',
      }
    case 'left':
      return {
        position: 'fixed',
        top: rect.top + rect.height / 2,
        left: rect.left - gap,
        transform: 'translate(-100%, -50%)',
      }
    case 'right':
      return {
        position: 'fixed',
        top: rect.top + rect.height / 2,
        left: rect.right + gap,
        transform: 'translate(0, -50%)',
      }
  }
}

function TooltipBody({
  content,
  placement = 'top',
  wrapperClassName,
  children,
}: Props & { content: ReactNode }) {
  const triggerRef = useRef<HTMLSpanElement>(null)
  const [open, setOpen] = useState(false)
  const [style, setStyle] = useState<CSSProperties>({})

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current
    if (!trigger) return

    setStyle(tooltipStyle(trigger.getBoundingClientRect(), placement))
  }, [placement])

  const show = useCallback(() => {
    updatePosition()
    setOpen(true)
  }, [updatePosition])

  const hide = useCallback(() => setOpen(false), [])

  useEffect(() => {
    if (!open) return

    const onDismiss = () => hide()
    window.addEventListener('scroll', onDismiss, true)
    window.addEventListener('resize', onDismiss)

    return () => {
      window.removeEventListener('scroll', onDismiss, true)
      window.removeEventListener('resize', onDismiss)
    }
  }, [open, hide])

  const child = Children.only(children)
  const trigger = cloneElement(child, {
    title: undefined,
  })

  return (
    <>
      <span
        ref={triggerRef}
        className={clsx('relative inline-flex', wrapperClassName)}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocusCapture={show}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) hide()
        }}
      >
        {trigger}
      </span>
      {open
        ? createPortal(
            <span
              role="tooltip"
              className="pointer-events-none fixed z-50 flex w-max max-w-50 items-center gap-1.5 rounded bg-zinc-800 px-2 py-1 text-xs text-zinc-100"
              style={style}
            >
              {content}
            </span>,
            document.body,
          )
        : null}
    </>
  )
}

/** Styled tooltips portaled to `document.body` so they are not clipped by scroll panels. */
export function Tooltip({ content, placement, wrapperClassName, children }: Props) {
  if (content === undefined || content === null || content === '') {
    return children
  }

  return (
    <TooltipBody content={content} placement={placement} wrapperClassName={wrapperClassName}>
      {children}
    </TooltipBody>
  )
}
