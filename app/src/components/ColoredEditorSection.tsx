import clsx from 'clsx'
import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from 'react'

export type ColoredEditorSectionColor = string | readonly [string, string]

type ColoredEditorSectionProps = {
  title: ReactNode
  /** Solid hex color, or `[from, to]` for a horizontal gradient header and body tint. */
  color: ColoredEditorSectionColor
  /** Optional solid body tint; defaults to a translucent version of `color`. */
  bodyColor?: string
  children?: ReactNode
  /** Optional control aligned to the right of the header (e.g. Split/Same switch). */
  headerTrailing?: ReactNode
  contentClassName?: string
} & Omit<ComponentPropsWithoutRef<'section'>, 'title' | 'children' | 'color'>

function tintBackground(color: ColoredEditorSectionColor): CSSProperties {
  if (typeof color === 'string') {
    return { backgroundColor: `${color}20` }
  }
  return {
    backgroundImage: `linear-gradient(90deg, ${color[0]}24, ${color[1]}24)`,
  }
}

function headerBackground(color: ColoredEditorSectionColor): CSSProperties {
  if (typeof color === 'string') {
    return { backgroundColor: color }
  }
  return {
    backgroundImage: `linear-gradient(90deg, ${color[0]}, ${color[1]})`,
  }
}

export function ColoredEditorSection({
  title,
  color,
  bodyColor,
  children,
  headerTrailing,
  className,
  contentClassName,
  style,
  ...props
}: ColoredEditorSectionProps) {
  const hasBody = children != null && children !== false

  return (
    <section
      className={clsx(
        'mb-4 overflow-hidden rounded-sm ring-1 ring-zinc-950/5 last:mb-0',
        className,
      )}
      style={{ ...tintBackground(bodyColor ?? color), ...style }}
      {...props}
    >
      <div
        className="flex items-center justify-between gap-2 px-2 py-1 text-xs font-semibold tracking-wide text-white uppercase"
        style={headerBackground(color)}
      >
        <span>{title}</span>
        {headerTrailing ? <div className="flex shrink-0 items-center">{headerTrailing}</div> : null}
      </div>
      {hasBody ? <div className={clsx('px-2 py-1.5', contentClassName)}>{children}</div> : null}
    </section>
  )
}
