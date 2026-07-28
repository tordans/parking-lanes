import { create } from 'zustand'
import type { HandleGeometry } from '../domain/handle-geometry'

interface WidthMapStore {
  draftWidthM: number | null
  handles: HandleGeometry | null
  /** Handle positions (0–1) placed by the user for {@link handleFractionsKey}. */
  handleFractions: number[] | null
  handleFractionsKey: string | null
  dragSide: 'left' | 'right' | null
  dragStartWidthM: number | null
  actions: {
    setDraftWidthM: (widthM: number | null) => void
    setHandles: (handles: HandleGeometry | null) => void
    setHandleFractions: (key: string, fractions: number[]) => void
    startDrag: (side: 'left' | 'right', startWidthM: number) => void
    endDrag: () => void
    clearDraft: () => void
  }
}

export const useWidthMapStore = create<WidthMapStore>()((set) => ({
  draftWidthM: null,
  handles: null,
  handleFractions: null,
  handleFractionsKey: null,
  dragSide: null,
  dragStartWidthM: null,
  actions: {
    setDraftWidthM: (draftWidthM) => set({ draftWidthM }),
    setHandles: (handles) => set({ handles }),
    setHandleFractions: (handleFractionsKey, handleFractions) =>
      set({ handleFractionsKey, handleFractions }),
    startDrag: (dragSide, dragStartWidthM) => set({ dragSide, dragStartWidthM }),
    endDrag: () => set({ dragSide: null, dragStartWidthM: null }),
    clearDraft: () =>
      set({
        draftWidthM: null,
        handles: null,
        handleFractions: null,
        handleFractionsKey: null,
        dragSide: null,
        dragStartWidthM: null,
      }),
  },
}))

export const useDraftWidthM = () => useWidthMapStore((s) => s.draftWidthM)
export const useWidthHandles = () => useWidthMapStore((s) => s.handles)
export const useWidthDragSide = () => useWidthMapStore((s) => s.dragSide)
export const useWidthMapActions = () => useWidthMapStore((s) => s.actions)
