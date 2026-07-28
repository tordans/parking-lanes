import { type OsmWay } from '@osm-editor-kit/osm-data'
import { ColoredEditorSection } from '../../../../components/ColoredEditorSection'
import { parkingConditionLegendLabel } from '../../../../i18n/legend-labels'
import { useDatetime } from '../../../../shell/app-store'
import { type ParkingTagInfo } from '../../../../utils/types/parking'
import { getConditionByDate } from '../../domain/condition-color'
import { getSideConditions } from '../../domain/side-conditions'
import {
  parkingBothBodyColor,
  parkingSideColor,
  parkingSideLabel,
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
  const datetime = useDatetime()
  if (!props.shown) return null

  const sideLabel = parkingSideLabel(props.side)
  const condition = getConditionByDate(getSideConditions(props.side, props.osm.tags), datetime)
  const styleLabel = parkingConditionLegendLabel(condition)

  return (
    <ColoredEditorSection
      id={props.side}
      aria-label={`${sideLabel}: ${styleLabel}`}
      title={sideLabel}
      headerTrailing={<span className="font-medium normal-case tracking-normal">{styleLabel}</span>}
      color={parkingSideColor(props.side)}
      bodyColor={props.side === 'both' ? parkingBothBodyColor : undefined}
      className={`tags-block tags-block_${props.side}`}
    >
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
    </ColoredEditorSection>
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
