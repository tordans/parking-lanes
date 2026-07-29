import * as m from '@app/paraglide/messages'
import { type OsmObject, type OsmWay } from '@osm-editor-kit/osm-data'
import { AuthState, useAuthState } from '../../../shell/app-store'
import {
  MapFeatureLoadEmptyState,
  MapFeaturePromptEmptyState,
} from '../../../shell/controls/MapFeatureEmptyState'
import { useSelectedOsmRef } from '../../../shell/map/feature-selection-store'
import { useMapViewport } from '../../../shell/map/map-viewport'
import type { Side } from '../../../utils/types/parking'
import { screenOrderedParkingSides, wayLineCoordinates } from '../domain/way-side-order'
import { viewMinZoom } from '../map/constants'
import { useParkingOsmQuery } from '../map/parking-osm-query'
import { useOsmAuth } from '../map/use-osm-auth'
import { useParkingOsmChangeHandler } from '../use-parking-mode-handlers'
import { LaneEditForm } from './editor/EditorForm'
import { LoginCallout } from './LoginCallout'

export function OsmObjectPanel() {
  const onChange = useParkingOsmChangeHandler()
  const mapViewport = useMapViewport()
  const selectedOsmRef = useSelectedOsmRef()
  const authState = useAuthState()
  const { login } = useOsmAuth()
  const { data: graph, isFetching } = useParkingOsmQuery({ select: (osmData) => osmData.graph })

  if (!selectedOsmRef) {
    return <MapFeaturePromptEmptyState message={m.empty_click_parking()} />
  }

  const selectedOsmObject =
    graph?.ways[selectedOsmRef.id] ??
    graph?.nodes[selectedOsmRef.id] ??
    graph?.relations[selectedOsmRef.id] ??
    null

  if (!selectedOsmObject) {
    return (
      <MapFeatureLoadEmptyState
        zoom={mapViewport.zoom}
        minZoom={viewMinZoom}
        isFetching={isFetching}
        featureLabel={`${selectedOsmRef.type}/${selectedOsmRef.id}`}
      />
    )
  }

  const isStreetParking =
    selectedOsmObject.tags.highway && selectedOsmObject.tags.amenity !== 'parking'
  const readOnly = authState !== AuthState.success
  const sideOrder: [Side, Side] =
    selectedOsmObject.type === 'way' && graph
      ? screenOrderedParkingSides(
          wayLineCoordinates(selectedOsmObject as OsmWay, graph.nodeCoords),
          mapViewport.bearing ?? 0,
        )
      : ['left', 'right']

  return (
    <div className="flex min-w-[250px] flex-col text-zinc-900">
      {isStreetParking ? (
        <>
          {readOnly ? (
            <div className="mb-3">
              <LoginCallout onLogin={() => void login()} />
            </div>
          ) : null}
          <LaneEditForm
            osm={selectedOsmObject as OsmWay}
            sideOrder={sideOrder}
            readOnly={readOnly}
            onChange={onChange}
          />
        </>
      ) : (
        <>
          {readOnly ? (
            <div className="mb-3">
              <LoginCallout onLogin={() => void login()} />
            </div>
          ) : null}
          <OsmObjectInfo osm={selectedOsmObject} />
        </>
      )}
    </div>
  )
}

function OsmObjectInfo(props: { osm: OsmObject }) {
  return (
    <table className="w-full font-mono text-sm text-zinc-900">
      <tbody>
        {Object.keys(props.osm.tags).map((tag) => (
          <tr key={tag}>
            <td className="pr-2 align-top">{tag}</td>
            <td className="break-words">{props.osm.tags[tag]}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
