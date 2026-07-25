import { buildWayCutGeojson } from './build-way-cut-geojson'
import { useSelectedOsmRef } from './feature-selection'
import {
  useIsCutActive,
  useWayCutHoveredNodeId,
  useWayCutMarkers,
  useWayCutPreview,
} from './way-cut-store'
import { WayCutMarkersSource } from './WayCutMarkersSource'

export function WayCutLayers() {
  const isCutActive = useIsCutActive()
  const cutMarkers = useWayCutMarkers()
  const hoveredNodeId = useWayCutHoveredNodeId()
  const preview = useWayCutPreview()
  const selectedOsmRef = useSelectedOsmRef()
  const selectedWayId = selectedOsmRef?.type === 'way' ? selectedOsmRef.id : 0

  if (!isCutActive) return null

  const geojson = buildWayCutGeojson({
    cutMarkers,
    hoveredNodeId,
    preview,
    selectedWayId,
  })

  return <WayCutMarkersSource data={geojson} />
}
