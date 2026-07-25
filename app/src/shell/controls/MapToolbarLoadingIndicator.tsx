import clsx from 'clsx'
import { Tooltip } from '../../components/Tooltip/Tooltip'
import { useMapChromeBusyLabel } from '../map/map-store'
import { mapToolbarLoadingSegmentClassName } from '../map/mobileMapChrome.const'

export function MapToolbarLoadingIndicator() {
  const label = useMapChromeBusyLabel()

  if (!label) return null

  return (
    <Tooltip content={label} placement="bottom">
      <span
        className={clsx(mapToolbarLoadingSegmentClassName, 'cursor-default')}
        aria-label={label}
      >
        <span
          aria-hidden
          className="size-4 animate-spin rounded-full border-2 border-zinc-600 border-t-white"
        />
      </span>
    </Tooltip>
  )
}
