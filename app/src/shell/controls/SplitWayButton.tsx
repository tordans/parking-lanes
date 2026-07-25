import clsx from 'clsx'
import { Scissors } from 'lucide-react'
import { Tooltip } from '../../components/Tooltip/Tooltip'
import {
  mapToolbarButtonGroupClassName,
  mapToolbarIconSegmentActiveClassName,
  mapToolbarIconSegmentClassName,
} from '../map/mobileMapChrome.const'
import {
  splitWayDisabledTooltip,
  useSplitWayAvailability,
  useWayCutHandler,
} from '../map/use-way-cut'

export function SplitWayButton() {
  const { disabledReason, isCutActive } = useSplitWayAvailability()
  const { toggleCutForSelectedWay } = useWayCutHandler()
  const disabled = disabledReason != null
  const tooltip = disabled
    ? splitWayDisabledTooltip(disabledReason)
    : isCutActive
      ? 'Cancel split — click a yellow node, or press again to cancel'
      : 'Split way at a node'

  return (
    <div className={mapToolbarButtonGroupClassName}>
      <Tooltip content={tooltip} placement="bottom">
        <span className="inline-flex">
          <button
            type="button"
            aria-label={tooltip ?? 'Split way'}
            aria-pressed={isCutActive}
            disabled={disabled}
            className={clsx(
              isCutActive ? mapToolbarIconSegmentActiveClassName : mapToolbarIconSegmentClassName,
              disabled && 'cursor-not-allowed opacity-50 hover:bg-white',
            )}
            onClick={() => {
              if (disabled) return
              toggleCutForSelectedWay()
            }}
          >
            <Scissors className="size-5 shrink-0" aria-hidden />
          </button>
        </span>
      </Tooltip>
    </div>
  )
}
