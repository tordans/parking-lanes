import { type OsmTags } from '@osm-editor-kit/osm-data'
import {
  getDependentTagKeys,
  getTagLabel,
  parkingLaneTags,
  resolveTagKey,
  shouldShowTag,
} from '../parking/domain/editor/tag-schema'

describe('tag schema', () => {
  test('resolveTagKey substitutes side placeholder', () => {
    expect(resolveTagKey('parking:{side}:fee', 'right')).toBe('parking:right:fee')
  })

  test('getTagLabel uses side when template has no suffix', () => {
    expect(getTagLabel('parking:{side}', 'right')).toBe('right')
    expect(getTagLabel('parking:{side}:fee', 'left')).toBe('fee')
  })

  test('shouldShowTag hides reason unless parking position is no', () => {
    const reasonTag = parkingLaneTags.find((tag) => tag.template === 'parking:{side}:reason')!

    expect(shouldShowTag(reasonTag, { 'parking:right': 'no' }, 'right')).toBe(true)
    expect(shouldShowTag(reasonTag, { 'parking:right': 'yes' }, 'right')).toBe(false)
  })

  test('shouldShowTag shows orientation for lane positions', () => {
    const orientationTag = parkingLaneTags.find(
      (tag) => tag.template === 'parking:{side}:orientation',
    )!

    expect(shouldShowTag(orientationTag, { 'parking:left': 'lane' }, 'left')).toBe(true)
    expect(shouldShowTag(orientationTag, { 'parking:left': 'no' }, 'left')).toBe(false)
  })

  test('getDependentTagKeys resolves dependent tag templates', () => {
    const feeTag = parkingLaneTags.find((tag) => tag.template === 'parking:{side}:fee')!

    expect(getDependentTagKeys(feeTag, 'right')).toStrictEqual(['parking:right:fee:conditional'])
  })

  test('restriction reason only shows when restriction is set', () => {
    const tags: OsmTags = {
      'parking:right:restriction': 'no_parking',
    }
    const restrictionReasonTag = parkingLaneTags.find(
      (tag) => tag.template === 'parking:{side}:restriction:reason',
    )!

    expect(shouldShowTag(restrictionReasonTag, tags, 'right')).toBe(true)
    expect(shouldShowTag(restrictionReasonTag, {}, 'right')).toBe(false)
  })
})
