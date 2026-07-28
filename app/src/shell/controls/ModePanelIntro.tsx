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
}) {
  const categoryLabel = highwayCategoryLabel(props.highway) ?? m.panel_way_fallback()
  const wayRef = `way/${props.wayId}`
  const idLine = props.featureSuffix ? `${wayRef} · ${props.featureSuffix}` : wayRef

  return (
    <div className={props.className ?? 'mb-1.5 flex items-center gap-2'}>
      {props.leading}
      <div className="ml-auto flex shrink-0 items-center gap-2">
        <div className="text-right text-xs leading-tight text-zinc-700">
          <div className="font-medium text-zinc-900">{categoryLabel}</div>
          <div className="font-mono text-[11px] text-zinc-500">{idLine}</div>
        </div>
        {props.trailing}
      </div>
    </div>
  )
}
