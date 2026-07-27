import * as m from '@app/paraglide/messages'
import { Checkbox, CheckboxField } from '../../components/catalyst/checkbox'
import { Label } from '../../components/catalyst/fieldset'
import { atlasDistrictLinePaint } from '../map/atlas-boundaries-paint'
import { useMapBoundaries } from '../map/use-map-boundaries'
import { useMapFocusSupportsCurrentMode } from '../map/use-map-focus'

function BoundarySwatch() {
  return (
    <svg className="size-4 shrink-0" viewBox="0 0 16 16" aria-hidden>
      <line
        x1="1"
        y1="8"
        x2="15"
        y2="8"
        stroke={atlasDistrictLinePaint['line-color']}
        strokeWidth="2"
        strokeOpacity={atlasDistrictLinePaint['line-opacity']}
        strokeDasharray="4 2 2 2"
      />
    </svg>
  )
}

export function LegendBoundariesEntry() {
  const supportsFocus = useMapFocusSupportsCurrentMode()
  const { boundariesEnabled, setBoundariesEnabled } = useMapBoundaries()
  const showToggle = !supportsFocus

  return (
    <div className="flex items-center gap-1.5 break-inside-avoid">
      <BoundarySwatch />
      <span className="min-w-0 flex-1 text-sm leading-tight text-zinc-800">
        {m.legend_boundaries_districts()}
      </span>
      {showToggle ? (
        <CheckboxField className="!gap-1.5">
          <Checkbox
            checked={boundariesEnabled}
            onChange={setBoundariesEnabled}
            aria-label={m.legend_boundaries_toggle_aria()}
          />
          <Label className="sr-only">{m.legend_boundaries_toggle_aria()}</Label>
        </CheckboxField>
      ) : null}
    </div>
  )
}
