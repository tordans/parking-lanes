import type { OsmWay } from '@osm-editor-kit/osm-data'
import type { StreetSpaceMode } from '../../modes/types'
import { DatetimeInput } from './Datetime'
import { FetchButton } from './Fetch'
import { ModeSwitcher } from './ModeSwitcher'
import { SaveButton } from './SaveButton'

export function ControlPanel(props: {
  mode: StreetSpaceMode
  onFetch: () => void
  onSave: () => void
  onCutLane: (way: OsmWay) => void
  onOsmChange: (way: OsmWay) => void
  onClose: () => void
}) {
  const { Panel } = props.mode

  return (
    <div className="flex h-full flex-col overflow-hidden p-2 text-sm">
      <div className="flex shrink-0 flex-col gap-2">
        <ModeSwitcher />
        <div className="flex items-center justify-between gap-2">
          <DatetimeInput />
          <div className="flex items-center gap-2">
            <FetchButton onClick={props.onFetch} />
            <SaveButton onClick={props.onSave} />
          </div>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        <Panel
          onCutLane={props.onCutLane}
          onOsmChange={props.onOsmChange}
          onClose={props.onClose}
        />
      </div>
    </div>
  )
}
