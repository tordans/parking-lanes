import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AllTagsStore {
  allTagsOpen: boolean
  actions: {
    setAllTagsOpen: (open: boolean) => void
  }
}

const useAllTagsStore = create<AllTagsStore>()(
  persist(
    (set) => ({
      allTagsOpen: false,
      actions: {
        setAllTagsOpen: (allTagsOpen) =>
          set((state) => (state.allTagsOpen === allTagsOpen ? state : { allTagsOpen })),
      },
    }),
    {
      name: 'street-space-all-tags',
      partialize: (state) => ({ allTagsOpen: state.allTagsOpen }),
    },
  ),
)

export const useAllTagsOpen = () => useAllTagsStore((state) => state.allTagsOpen)

export const useAllTagsActions = () => useAllTagsStore((state) => state.actions)
