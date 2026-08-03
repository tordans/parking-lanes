import { create } from 'zustand'
import { DEFAULT_TABLE_GROUP_OPEN, type TableTagGroupId } from '../domain/tag-groups'

/**
 * Session UI for table tag-group disclosures.
 * Shared across ways (not cleared when walking the chain or clearing map chain state).
 */
interface TableGroupUiStore {
  openGroups: Record<TableTagGroupId, boolean>
  actions: {
    setGroupOpen: (groupId: TableTagGroupId, open: boolean) => void
    toggleGroup: (groupId: TableTagGroupId) => void
  }
}

const useTableGroupUiStore = create<TableGroupUiStore>()((set) => ({
  openGroups: { ...DEFAULT_TABLE_GROUP_OPEN },
  actions: {
    setGroupOpen: (groupId, open) =>
      set((state) =>
        state.openGroups[groupId] === open
          ? state
          : { openGroups: { ...state.openGroups, [groupId]: open } },
      ),
    toggleGroup: (groupId) =>
      set((state) => ({
        openGroups: { ...state.openGroups, [groupId]: !state.openGroups[groupId] },
      })),
  },
}))

export const useTableGroupOpen = (groupId: TableTagGroupId) =>
  useTableGroupUiStore((state) => state.openGroups[groupId])

export const useTableGroupUiActions = () => useTableGroupUiStore((state) => state.actions)
