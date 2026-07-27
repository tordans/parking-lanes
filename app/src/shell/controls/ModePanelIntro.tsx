import * as m from '@app/paraglide/messages'
import type { ReactNode } from 'react'
import { Button } from '../../components/catalyst/button'
import { Tooltip } from '../../components/Tooltip/Tooltip'
import { highwayCategoryLabel } from '../../i18n/highway-labels'

export function ModePanelIntro(props: {
  wayId: number
  highway?: string
  /** Extra context in the hover tooltip, e.g. `cycleway/left`. */
  featureSuffix?: string
  leading?: ReactNode
  trailing?: ReactNode
  className?: string
}) {
  const categoryLabel = highwayCategoryLabel(props.highway) ?? m.panel_way_fallback()
  const wayRef = `way/${props.wayId}`
  const wayLabel = props.featureSuffix ? `${wayRef} · ${props.featureSuffix}` : wayRef
  const tooltip = m.panel_open_way({ wayLabel })
  const historyHref = `https://openstreetmap.org/way/${props.wayId}/history`

  return (
    <div className={props.className ?? 'mb-1.5 flex items-center gap-2'}>
      {props.leading}
      <div className="ml-auto flex shrink-0 items-center gap-2">
        <Tooltip content={tooltip} placement="bottom">
          <Button
            outline
            href={historyHref}
            target="_blank"
            rel="noreferrer"
            aria-label={m.panel_way_history_aria({ category: categoryLabel, wayLabel })}
            className="!px-2 !py-0.5 text-xs font-medium sm:!px-2 sm:!py-0.5 sm:!text-xs"
          >
            {categoryLabel}
          </Button>
        </Tooltip>
        {props.trailing}
      </div>
    </div>
  )
}
