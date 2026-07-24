import type { OsmWay } from '@osm-editor-kit/osm-data'
import { DatetimeInput } from './Datetime'
import { FetchButton } from './Fetch'
import { OsmObjectPanel } from './LaneInfo'
import { SaveButton } from './SaveButton'

export function ControlPanel(props: {
  onFetch: () => void
  onSave: () => void
  onCutLane: (way: OsmWay) => void
  onOsmChange: (way: OsmWay) => void
  onClose: () => void
}) {
  return (
    <div className="flex h-full flex-col overflow-hidden p-2 text-sm">
      <div className="flex shrink-0 items-center justify-between gap-2">
        <DatetimeInput />
        <div className="flex items-center gap-2">
          <FetchButton onClick={props.onFetch} />
          <SaveButton onClick={props.onSave} />
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        <OsmObjectPanel
          onCutLane={props.onCutLane}
          onChange={props.onOsmChange}
          onClose={props.onClose}
        />
      </div>
    </div>
  )
}
