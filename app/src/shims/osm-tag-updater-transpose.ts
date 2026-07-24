import { createRequire } from 'node:module'

export interface TagMigrationResult {
  newTagObjects: Record<string, { newTags: string[] }>
  newTagsManualCandidates: Record<string, unknown>
}

const require = createRequire(import.meta.url)
const { transpose: transposeImpl } =
  require('../../node_modules/osm-parking-tag-updater/src/components/Tool/transpose/transpose') as {
    transpose: (tagLines: string[]) => TagMigrationResult
  }

export function transpose(tagLines: string[]): TagMigrationResult {
  return transposeImpl(tagLines)
}
