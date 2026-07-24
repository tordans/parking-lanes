import { type OsmTags } from '@osm-editor-kit/osm-data'
import { transpose } from 'osm-parking-tag-updater/src/components/Tool/transpose/transpose'

export function tagsToTagLines(tags: OsmTags): string[] {
  return Object.entries(tags).map(([key, value]) => `${key}=${value}`)
}

export function getTagMigrationInfo(tags: OsmTags) {
  return transpose(tagsToTagLines(tags))
}

export function hasTagMigration(tags: OsmTags): boolean {
  return Object.keys(getTagMigrationInfo(tags).newTagObjects).length > 0
}

export function applyTagMigration(tags: OsmTags): OsmTags {
  const migratedTags = { ...tags }
  const updateInfo = getTagMigrationInfo(migratedTags)

  for (const tagMap of Object.entries(updateInfo.newTagObjects)) {
    const oldKey = tagMap[0].split('=')[0]
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete migratedTags[oldKey]
    for (const newTag of tagMap[1].newTags) {
      const [newKey, newValue] = newTag.split('=')
      migratedTags[newKey] = newValue
    }
  }

  return migratedTags
}
