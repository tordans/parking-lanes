import type { OsmWay } from '../../utils/types/osm-data'
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
    <div className="panel control-padding control-bigfont">
      <div>
        <div className="data-controls">
          <DatetimeInput />
          <div className="data-controls__right">
            <FetchButton onClick={props.onFetch} />
            <SaveButton onClick={props.onSave} />
          </div>
        </div>
        <OsmObjectPanel
          onCutLane={props.onCutLane}
          onChange={props.onOsmChange}
          onClose={props.onClose}
        />
      </div>
    </div>
  )
}
