import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const SIDEBAR_WIDTH_DEFAULT = 384
export const SIDEBAR_WIDTH_MIN = 288
export const SIDEBAR_WIDTH_MAX = 576

export const BOTTOM_PANEL_HEIGHT_DEFAULT = 256
export const BOTTOM_PANEL_HEIGHT_MIN = 240
export const BOTTOM_PANEL_HEIGHT_MAX = 320

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(value)))
}

interface ShellPanelStore {
  sidebarWidth: number
  bottomPanelHeight: number
  actions: {
    setSidebarWidth: (width: number) => void
    setBottomPanelHeight: (height: number) => void
  }
}

const useShellPanelStore = create<ShellPanelStore>()(
  persist(
    (set) => ({
      sidebarWidth: SIDEBAR_WIDTH_DEFAULT,
      bottomPanelHeight: BOTTOM_PANEL_HEIGHT_DEFAULT,
      actions: {
        setSidebarWidth: (width) => {
          const sidebarWidth = clamp(width, SIDEBAR_WIDTH_MIN, SIDEBAR_WIDTH_MAX)
          set((state) => (state.sidebarWidth === sidebarWidth ? state : { sidebarWidth }))
        },
        setBottomPanelHeight: (height) => {
          const bottomPanelHeight = clamp(height, BOTTOM_PANEL_HEIGHT_MIN, BOTTOM_PANEL_HEIGHT_MAX)
          set((state) =>
            state.bottomPanelHeight === bottomPanelHeight ? state : { bottomPanelHeight },
          )
        },
      },
    }),
    {
      name: 'street-space-shell-panel',
      partialize: (state) => ({
        sidebarWidth: state.sidebarWidth,
        bottomPanelHeight: state.bottomPanelHeight,
      }),
    },
  ),
)

export const useSidebarWidth = () => useShellPanelStore((state) => state.sidebarWidth)

export const useBottomPanelHeight = () => useShellPanelStore((state) => state.bottomPanelHeight)

export const useShellPanelActions = () => useShellPanelStore((state) => state.actions)
