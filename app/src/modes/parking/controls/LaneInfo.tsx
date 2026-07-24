import { overpassDeUrl } from '@osm-editor-kit/osm-coverage'
import { type OsmObject, type OsmTags, type OsmWay } from '@osm-editor-kit/osm-data'
import {
  handleJosmLinkClick,
  idEditorUrl,
  josmUrl,
  mapillaryUrl,
} from '@osm-editor-kit/osm-editor-links'
import { Button } from '../../../components/catalyst/button'
import { AuthState, useAuthState, useMapState } from '../../../shell/app-store'
import { useSelectedOsmRef } from '../../../shell/map/feature-selection'
import { viewMinZoom } from '../map/constants'
import { useParkingOsmQuery } from '../map/parking-osm-query'
import { useOsmAuth } from '../map/use-osm-auth'
import { LaneEditForm } from './editor/EditorForm'
import { LoginCallout } from './LoginCallout'

export function OsmObjectPanel(props: {
  onCutLane?: (way: OsmWay) => void
  onChange?: (way: OsmWay) => void
  onClose?: () => void
}) {
  const mapState = useMapState()
  const selectedOsmRef = useSelectedOsmRef()
  const authState = useAuthState()
  const { login } = useOsmAuth()
  const { data: graph, isFetching } = useParkingOsmQuery({ select: (osmData) => osmData.graph })
  const { data: waysInRelation = {} } = useParkingOsmQuery({
    select: (osmData) => osmData.graph.waysInRelation,
  })

  if (!selectedOsmRef) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center text-sm text-zinc-600">
        <p className="m-0">Click a way on the map to inspect and edit parking tags.</p>
      </div>
    )
  }

  const selectedOsmObject =
    graph?.ways[selectedOsmRef.id] ??
    graph?.nodes[selectedOsmRef.id] ??
    graph?.relations[selectedOsmRef.id] ??
    null

  if (!selectedOsmObject) {
    const belowMinZoom = mapState != null && mapState.zoom < viewMinZoom
    return (
      <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center text-sm text-zinc-600">
        {belowMinZoom ? (
          <p className="m-0">Zoom in to load this feature.</p>
        ) : isFetching ? (
          <p className="m-0">Loading feature…</p>
        ) : (
          <p className="m-0">
            Feature {selectedOsmRef.type}/{selectedOsmRef.id} is not in the loaded area. Pan the map
            to load it.
          </p>
        )}
      </div>
    )
  }

  const isStreetParking =
    selectedOsmObject.tags.highway && selectedOsmObject.tags.amenity !== 'parking'
  const readOnly = authState !== AuthState.success

  return (
    <div className="max-sm:fixed max-sm:right-0 max-sm:bottom-0 max-sm:left-0 max-sm:z-50 max-sm:max-h-[50vh] max-sm:overflow-auto max-sm:rounded-t-lg max-sm:border-t max-sm:border-zinc-950/5 max-sm:bg-white max-sm:px-2 max-sm:pt-3.5 max-sm:pb-[calc(env(safe-area-inset-bottom)+0.25rem)] max-sm:shadow-lg">
      <div className="flex min-w-[250px] items-start justify-between gap-2">
        <span className="text-sm">
          <span>View: </span>
          <a
            href={`https://openstreetmap.org/way/${selectedOsmObject.id}`}
            target="_blank"
            rel="noreferrer"
            className="text-blue-600 hover:underline"
          >
            OSM
          </a>
          <span>, </span>
          <a
            href={`${mapillaryUrl(mapState?.center ?? { lat: 0, lng: 0 })}`}
            target="_blank"
            rel="noreferrer"
            className="text-blue-600 hover:underline"
          >
            Mapillary
          </a>
        </span>
        <span className="max-sm:hidden text-sm">
          <span>Edit: </span>
          <a
            href={`${josmUrl + overpassDeUrl + getWayWithRelationsOverpassQuery(selectedOsmObject.id).replace(/\s+/g, ' ')}`}
            target="_blank"
            rel="noreferrer"
            className="text-blue-600 hover:underline"
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            onClick={(e) => handleJosmLinkClick(e.nativeEvent)}
          >
            Josm
          </a>
          <span>, </span>
          <a
            href={`${idEditorUrl({ osmObjectType: 'way', osmObjectId: selectedOsmObject.id })}`}
            target="_blank"
            rel="noreferrer"
            className="text-blue-600 hover:underline"
          >
            iD
          </a>
        </span>
        <Button
          plain
          className="hidden max-sm:inline-flex"
          aria-label="Close"
          onClick={props.onClose}
        >
          +
        </Button>
      </div>
      <hr className="my-2" />
      {isStreetParking ? (
        <>
          <LaneEditForm
            osm={selectedOsmObject as OsmWay}
            waysInRelation={waysInRelation}
            readOnly={readOnly}
            onCutLane={props.onCutLane!}
            onChange={props.onChange!}
          />
          {readOnly ? (
            <div className="mt-4">
              <LoginCallout onLogin={() => void login()} />
            </div>
          ) : null}
        </>
      ) : (
        <>
          <OsmObjectInfo osm={selectedOsmObject} />
          {readOnly ? (
            <div className="mt-4">
              <LoginCallout onLogin={() => void login()} />
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}

function getWayWithRelationsOverpassQuery(wayId: number) {
  return `
        [out:xml];
        (
            way(id:${wayId});
            >;
            way(id:${wayId});
            <;
        );
        out meta;`
}

function OsmObjectInfo(props: { osm: OsmObject }) {
  return (
    <table className="w-full text-sm">
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

export function AllTagsBlock(props: { tags: OsmTags }) {
  return (
    <details className="pt-1.5 text-sm text-zinc-600">
      <summary className="cursor-pointer">All tags</summary>
      <table className="w-full">
        <tbody>
          {Object.keys(props.tags).map((tag) => (
            <tr
              key={tag}
              className={`hover:bg-zinc-950/5 ${tag.startsWith('parking:') ? 'font-semibold' : ''}`}
            >
              <td className="max-w-[250px] break-words pr-2 align-top">{tag}</td>
              <td className="max-w-[250px] break-words">{props.tags[tag]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  )
}
