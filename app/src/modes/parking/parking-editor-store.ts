import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ParkingEditorStore {
  allTagsOpen: boolean
  actions: {
    setAllTagsOpen: (open: boolean) => void
  }
}

const useParkingEditorStore = create<ParkingEditorStore>()(
  persist(
    (set) => ({
      allTagsOpen: false,
      actions: {
        setAllTagsOpen: (allTagsOpen) =>
          set((state) => (state.allTagsOpen === allTagsOpen ? state : { allTagsOpen })),
      },
    }),
    {
      name: 'street-space-parking-editor',
      partialize: (state) => ({ allTagsOpen: state.allTagsOpen }),
    },
  ),
)

export const useAllTagsOpen = () => useParkingEditorStore((state) => state.allTagsOpen)

export const useParkingEditorActions = () => useParkingEditorStore((state) => state.actions)
