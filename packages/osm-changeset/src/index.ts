export {
  countChanges,
  removeChangedWay,
  upsertChangedNode,
  upsertChangedRelation,
  upsertChangedWay,
} from './changes'
export {
  applyUploadResult,
  changesStoreToOsmChange,
  changesStoreToOsmChangeXml,
} from './changeset-upload'
export { buildChangesetTags, type BuildChangesetTagsOptions } from './changeset-tags'
export { type ChangedIdMap, type ChangesStore, createEmptyChangesStore } from './changes-store'
