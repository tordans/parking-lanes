import { type OsmTags } from '@osm-editor-kit/osm-data'
import {
  applyTagMigration,
  getTagMigrationInfo,
  hasTagMigration,
  tagsToTagLines,
} from '../modes/parking/domain/editor/tag-migration'

describe('tag migration', () => {
  test('tagsToTagLines serializes tags', () => {
    expect(tagsToTagLines({ 'parking:lane:right': 'parallel' })).toStrictEqual([
      'parking:lane:right=parallel',
    ])
  })

  test('hasTagMigration is false for already-migrated tags', () => {
    const tags: OsmTags = {
      'parking:right': 'lane',
    }
    expect(hasTagMigration(tags)).toBe(false)
  })

  test('getTagMigrationInfo detects legacy lane tags', () => {
    const tags: OsmTags = {
      'parking:lane:right': 'parallel',
      'parking:condition:right': 'free',
    }
    const info = getTagMigrationInfo(tags)

    expect(Object.keys(info.newTagObjects).length).toBeGreaterThan(0)
  })

  test('applyTagMigration rewrites legacy tags in place', () => {
    const tags: OsmTags = {
      'parking:lane:right': 'parallel',
      'parking:condition:right': 'free',
      highway: 'residential',
    }
    const migrated = applyTagMigration(tags)

    expect(migrated['parking:lane:right']).toBeUndefined()
    expect(migrated.highway).toBe('residential')
    expect(Object.keys(migrated).some((key) => key.startsWith('parking:right'))).toBe(true)
  })
})
