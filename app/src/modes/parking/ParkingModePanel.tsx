import type { ModePanelProps } from '../types'
import { OsmObjectPanel } from './controls/LaneInfo'

export function ParkingModePanel(props: ModePanelProps) {
  return (
    <OsmObjectPanel
      onCutLane={props.onCutLane}
      onChange={props.onOsmChange}
      onClose={props.onClose}
    />
  )
}
