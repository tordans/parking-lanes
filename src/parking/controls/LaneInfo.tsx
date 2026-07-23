import { Button } from '../../components/catalyst/button'
import { osmData } from '../../utils/data-client'
import { handleJosmLinkClick } from '../../utils/josm'
import { idEditorUrl, josmUrl, mapillaryUrl, overpassDeUrl } from '../../utils/links'
import { type OsmObject, type OsmTags, type OsmWay } from '../../utils/types/osm-data'
import { useEditorMode, useMapState } from '../app-store'
import { useSelectedOsmObject } from '../map/parking-map-store'
import { LaneEditForm } from './editor/EditorForm'

export function OsmObjectPanel(props: {
  onCutLane?: (way: OsmWay) => void
  onChange?: (way: OsmWay) => void
  onClose?: () => void
}) {
  const mapState = useMapState()
  const selectedOsmObject = useSelectedOsmObject()
  const editorMode = useEditorMode()

  if (!selectedOsmObject) return null

  const isStreetParking =
    selectedOsmObject.tags.highway && selectedOsmObject.tags.amenity !== 'parking'

  return (
    <div className="mt-2 border-t border-zinc-950/5 pt-2 max-sm:fixed max-sm:right-0 max-sm:bottom-0 max-sm:left-0 max-sm:z-50 max-sm:mt-0 max-sm:max-h-[50vh] max-sm:overflow-auto max-sm:rounded-t-lg max-sm:border-t max-sm:bg-white max-sm:px-2 max-sm:pt-3.5 max-sm:pb-1 max-sm:shadow-lg">
      <hr className="max-sm:hidden" />
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
        editorMode ? (
          <LaneEditForm
            osm={selectedOsmObject as OsmWay}
            waysInRelation={osmData.waysInRelation}
            onCutLane={props.onCutLane!}
            onChange={props.onChange!}
          />
        ) : (
          <LaneInfo osm={selectedOsmObject as OsmWay} />
        )
      ) : (
        <OsmObjectInfo osm={selectedOsmObject} />
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

function LaneInfo(props: { osm: OsmWay }) {
  return (
    <div>
      <SideBlock tags={props.osm.tags} side="right" />
      <SideBlock tags={props.osm.tags} side="left" />
      <AllTagsBlock tags={props.osm.tags} />
    </div>
  )
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

function SideBlock(props: { tags: OsmTags; side: 'right' | 'left' }) {
  const regex = new RegExp('^parking:.*(?:' + props.side + '|both)')

  const filteredTags = Object.keys(props.tags)
    .filter((tag) => regex.test(tag))
    .map((tag) => tag + ' = ' + props.tags[tag])
    .map((tag) => (
      <p key={tag} className="m-0">
        {tag}
      </p>
    ))

  return (
    <div className={`p-1.5 ${props.side === 'right' ? 'bg-orange-100' : 'bg-violet-100'}`}>
      {filteredTags}
    </div>
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
