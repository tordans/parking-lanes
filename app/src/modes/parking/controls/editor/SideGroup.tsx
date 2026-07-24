import { type OsmWay } from '@osm-editor-kit/osm-data'
import { type ParkingTagInfo } from '../../../../utils/types/parking'
import {
  parkingSideCssVariables,
  parkingSideHeaderClassName,
  parkingSideLabel,
  parkingSideSectionClassName,
  parkingSideSectionStyle,
  type ParkingEditorSide,
} from '../../side-colors'
import { ConditionalInput } from './ConditionalInput'
import { parkingLaneTags, getTagLabel, resolveTagKey, shouldShowTag } from './lane-tags'
import { PresetSigns } from './PresetSigns'
import { SimpleTagInput } from './SimpleTagInput'
import { tagEditorTableClassName } from './tag-editor-controls'

export function SideGroup(props: {
  osm: OsmWay
  side: ParkingEditorSide
  shown: boolean
  readOnly?: boolean
  onChange: (key: string, value: string) => void
}) {
  if (!props.shown) return null

  return (
    <section
      id={props.side}
      aria-label={parkingSideLabel(props.side)}
      className={`tags-block tags-block_${props.side} ${parkingSideSectionClassName(props.side)}`}
      style={{ ...parkingSideCssVariables, ...parkingSideSectionStyle(props.side) }}
    >
      <div className={parkingSideHeaderClassName(props.side)}>{parkingSideLabel(props.side)}</div>
      <div className="px-2 py-1.5">
        <PresetSigns
          osm={props.osm}
          side={props.side}
          readOnly={props.readOnly}
          onChange={props.onChange}
        />
        <table className={tagEditorTableClassName}>
          <TagInputs
            osm={props.osm}
            side={props.side}
            readOnly={props.readOnly}
            onChange={props.onChange}
          />
        </table>
      </div>
    </section>
  )
}

function TagInputs(props: {
  osm: OsmWay
  side: ParkingEditorSide
  readOnly?: boolean
  onChange: (key: string, value: string) => void
}) {
  const unsupportedTags = Object.keys(props.osm.tags)
    .filter((x) => x.startsWith('parking:'))
    .filter((x) => x.includes(props.side))
    /* eslint-disable @typescript-eslint/indent */
    .map<ParkingTagInfo>((x) => ({
      template: x.replace(props.side, '{side}'),
      checkForNeedShowing: (_tags, _side) => true,
    }))
    /* eslint-enable @typescript-eslint/indent */
    .filter((x) => !parkingLaneTags.find((t) => t.template === x.template))

  const inputs = parkingLaneTags
    .concat(unsupportedTags)
    .map((tagInfo) => (
      <TagInput
        key={tagInfo.template}
        osm={props.osm}
        side={props.side}
        tagInfo={tagInfo}
        readOnly={props.readOnly}
        onChange={props.onChange}
      />
    ))

  return <tbody>{inputs}</tbody>
}

function TagInput(props: {
  osm: OsmWay
  side: ParkingEditorSide
  tagInfo: ParkingTagInfo
  readOnly?: boolean
  onChange: (key: string, value: string) => void
}) {
  const tag = resolveTagKey(props.tagInfo.template, props.side)
  const label = getTagLabel(props.tagInfo.template, props.side, tag)
  const hide = !shouldShowTag(props.tagInfo, props.osm.tags, props.side)
  return tag.endsWith(':conditional') ? (
    <ConditionalInput
      osm={props.osm}
      tag={tag}
      label={label}
      hide={hide}
      readOnly={props.readOnly}
      values={props.tagInfo.values}
      onChange={(v) => props.onChange(tag, v)}
    />
  ) : (
    <SimpleTagInput
      osm={props.osm}
      tag={tag}
      label={label}
      hide={hide}
      readOnly={props.readOnly}
      values={props.tagInfo.values}
      onChange={(v) => props.onChange(tag, v)}
    />
  )
}
