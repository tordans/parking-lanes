import { type OsmTags } from '@osm-editor-kit/osm-data'
import {
  getDependentTagKeys,
  getTagLabel,
  parkingLaneTags,
  resolveTagKey,
  shouldShowTag,
} from '../modes/parking/domain/editor/tag-schema'

describe('tag schema', () => {
  test('resolveTagKey substitutes side placeholder', () => {
    expect(resolveTagKey('parking:{side}:fee', 'right')).toBe('parking:right:fee')
  })

  test('getTagLabel uses side when template has no suffix', () => {
    expect(getTagLabel('parking:{side}', 'right')).toBe('right')
    expect(getTagLabel('parking:{side}:fee', 'left')).toBe('fee')
  })

  test('getTagLabel truncates long conditional tag labels for display', () => {
    expect(getTagLabel('parking:{side}:restriction:conditional', 'right')).toBe(
      'restri…:conditional',
    )
    expect(getTagLabel('parking:{side}:maxstay:conditional', 'left')).toBe('maxsta…:conditional')
    expect(getTagLabel('parking:{side}:fee:conditional', 'right')).toBe('fee:conditional')
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

  test('conditional tags show when parent or conditional value is set', () => {
    const maxstayConditionalTag = parkingLaneTags.find(
      (tag) => tag.template === 'parking:{side}:maxstay:conditional',
    )!
    const feeConditionalTag = parkingLaneTags.find(
      (tag) => tag.template === 'parking:{side}:fee:conditional',
    )!

    expect(shouldShowTag(maxstayConditionalTag, {}, 'right')).toBe(false)
    expect(shouldShowTag(maxstayConditionalTag, { 'parking:right:maxstay': '2h' }, 'right')).toBe(
      true,
    )
    expect(
      shouldShowTag(
        maxstayConditionalTag,
        { 'parking:right:maxstay:conditional': '1h @ Mo-Fr' },
        'right',
      ),
    ).toBe(true)

    expect(shouldShowTag(feeConditionalTag, { 'parking:right:fee': 'yes' }, 'right')).toBe(true)
    expect(
      shouldShowTag(feeConditionalTag, { 'parking:right:fee:conditional': 'no @ Sa' }, 'right'),
    ).toBe(true)
    expect(shouldShowTag(feeConditionalTag, {}, 'right')).toBe(false)
  })

  test('surface values come from parking side surface taginfo usage', () => {
    const surfaceTag = parkingLaneTags.find((tag) => tag.template === 'parking:{side}:surface')!
    const values = surfaceTag.values!.map((entry) => entry.value)

    expect(values).toContain('asphalt')
    expect(values).toContain('paving_stones')
    expect(values).not.toContain('acrylic')
  })
})
