import * as m from '@app/paraglide/messages'
import type { ReactNode } from 'react'
import { highwayCategoryLabel } from '../../i18n/highway-labels'

export function ModePanelIntro(props: {
  wayId: number
  highway?: string
  /** Extra context under the way id, e.g. `cycleway/left`. */
  featureSuffix?: string
  leading?: ReactNode
  trailing?: ReactNode
  className?: string
  /** Place the way identity on the left (surface mode). Default keeps it right-aligned. */
  identityStart?: boolean
}) {
  const categoryLabel = highwayCategoryLabel(props.highway) ?? m.panel_way_fallback()
  const wayRef = `way/${props.wayId}`
  const idLine = props.featureSuffix ? `${wayRef} · ${props.featureSuffix}` : wayRef
  const identityOnStart = props.identityStart === true

  return (
    <div className={props.className ?? 'mb-1.5 flex items-center gap-2'}>
      {props.leading}
      <div
        className={
          identityOnStart
            ? 'flex shrink-0 items-center gap-2'
            : 'ml-auto flex shrink-0 items-center gap-2'
        }
      >
        <div
          className={
            identityOnStart
              ? 'text-left text-xs leading-tight text-zinc-700'
              : 'text-right text-xs leading-tight text-zinc-700'
          }
        >
          <div className="font-medium text-zinc-900">{categoryLabel}</div>
          <div className="font-mono text-[11px] text-zinc-500">{idLine}</div>
        </div>
        {props.trailing}
      </div>
    </div>
  )
}
