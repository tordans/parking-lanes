import { type OsmTags } from '@osm-editor-kit/osm-data'
import { type ParkingTagInfo } from '../../../../utils/types/parking'
import {
  laneValues,
  orientationValues,
  reasonValues,
  restrictionValues,
  surfaceValues,
} from './tag-values'

export const parkingLaneTags: ParkingTagInfo[] = [
  {
    template: 'parking:{side}',
    values: laneValues,
    checkForNeedShowing: (_tags: OsmTags, _side: string) => true,
    dependentTags: [
      'parking:{side}:reason',
      'parking:{side}:orientation',
      'parking:{side}:surface',
    ],
  },
  {
    template: 'parking:{side}:reason',
    values: reasonValues,
    checkForNeedShowing: (tags: OsmTags, side: string) => tags[`parking:${side}`] === 'no',
  },
  {
    template: 'parking:{side}:orientation',
    values: orientationValues,
    checkForNeedShowing: (tags: OsmTags, side: string) =>
      ['lane', 'street_side', 'on_kerb', 'half_on_kerb', 'shoulder'].includes(
        tags[`parking:${side}`],
      ),
  },
  {
    template: 'parking:{side}:surface',
    values: surfaceValues,
    checkForNeedShowing: (tags: OsmTags, side: string) =>
      ['lane', 'street_side', 'on_kerb', 'half_on_kerb', 'shoulder', 'yes'].includes(
        tags[`parking:${side}`],
      ),
  },
  {
    template: 'parking:{side}:fee',
    values: [{ value: 'yes' }, { value: 'no' }],
    checkForNeedShowing: (_tags: OsmTags, _side: string) => true,
    dependentTags: ['parking:{side}:fee:conditional'],
  },
  {
    template: 'parking:{side}:fee:conditional',
    values: [{ value: 'yes' }, { value: 'no' }],
    checkForNeedShowing: showWhenParentOrConditionalFilled('parking:{side}:fee'),
  },
  {
    template: 'parking:{side}:maxstay',
    checkForNeedShowing: (_tags: OsmTags, _side: string) => true,
    dependentTags: ['parking:{side}:maxstay:conditional'],
  },
  {
    template: 'parking:{side}:maxstay:conditional',
    checkForNeedShowing: showWhenParentOrConditionalFilled('parking:{side}:maxstay'),
  },
  {
    template: 'parking:{side}:access',
    checkForNeedShowing: (_tags: OsmTags, _side: string) => true,
    dependentTags: ['parking:{side}:access:conditional'],
  },
  {
    template: 'parking:{side}:access:conditional',
    checkForNeedShowing: showWhenParentOrConditionalFilled('parking:{side}:access'),
  },
  {
    template: 'parking:{side}:restriction',
    values: restrictionValues,
    checkForNeedShowing: (_tags: OsmTags, _side: string) => true,
    dependentTags: ['parking:{side}:restriction:conditional', 'parking:{side}:restriction:reason'],
  },
  {
    template: 'parking:{side}:restriction:conditional',
    values: restrictionValues,
    checkForNeedShowing: showWhenParentOrConditionalFilled('parking:{side}:restriction'),
  },
  {
    template: 'parking:{side}:restriction:reason',
    values: reasonValues,
    checkForNeedShowing: (tags: OsmTags, side: string) => !!tags[`parking:${side}:restriction`],
  },
]

export function resolveTagKey(template: string, side: string): string {
  return template.replace('{side}', side)
}

function showWhenParentOrConditionalFilled(parentTemplate: string) {
  return (tags: OsmTags, side: string) => {
    const parentKey = resolveTagKey(parentTemplate, side)
    const conditionalKey = `${parentKey}:conditional`
    return Boolean(tags[parentKey]) || Boolean(tags[conditionalKey])
  }
}

export function shouldShowTag(tagInfo: ParkingTagInfo, tags: OsmTags, side: string): boolean {
  return tagInfo.checkForNeedShowing(tags, side)
}

export function getDependentTagKeys(tagInfo: ParkingTagInfo, side: string): string[] {
  return (tagInfo.dependentTags ?? []).map((template) => resolveTagKey(template, side))
}

const conditionalLabelSuffix = ':conditional'
const conditionalLabelPrefixMaxLength = 6

function compactConditionalTagLabel(label: string): string {
  if (!label.endsWith(conditionalLabelSuffix)) return label

  const prefix = label.slice(0, -conditionalLabelSuffix.length)
  if (prefix.length <= conditionalLabelPrefixMaxLength) return label

  return `${prefix.slice(0, conditionalLabelPrefixMaxLength)}…${conditionalLabelSuffix}`
}

export function getTagLabel(template: string, side: string, tag?: string): string {
  const resolvedTag = tag ?? resolveTagKey(template, side)
  const label = template.startsWith('parking:{side}')
    ? template.replace('parking:{side}', '').slice(1) || side
    : resolvedTag

  return compactConditionalTagLabel(label)
}
