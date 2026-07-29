import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const SIDEBAR_WIDTH_DEFAULT = 384
export const SIDEBAR_WIDTH_MIN = 288
export const SIDEBAR_WIDTH_MAX = 576

export const MIDDLE_COLUMN_WIDTH_DEFAULT = 360
export const MIDDLE_COLUMN_WIDTH_MIN = 240
export const MIDDLE_COLUMN_WIDTH_MAX = 480

export const BOTTOM_PANEL_HEIGHT_DEFAULT = 256
export const BOTTOM_PANEL_HEIGHT_MIN = 240
export const BOTTOM_PANEL_HEIGHT_MAX = 320

/** Bump when persisted defaults change so migrations can reset stale values. */
const SHELL_PANEL_PERSIST_VERSION = 2

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(value)))
}

interface ShellPanelStore {
  sidebarWidth: number
  middleColumnWidth: number
  bottomPanelHeight: number
  actions: {
    setSidebarWidth: (width: number) => void
    setMiddleColumnWidth: (width: number) => void
    setBottomPanelHeight: (height: number) => void
  }
}

type PersistedShellPanel = {
  sidebarWidth?: number
  middleColumnWidth?: number
  bottomPanelHeight?: number
}

const useShellPanelStore = create<ShellPanelStore>()(
  persist(
    (set) => ({
      sidebarWidth: SIDEBAR_WIDTH_DEFAULT,
      middleColumnWidth: MIDDLE_COLUMN_WIDTH_DEFAULT,
      bottomPanelHeight: BOTTOM_PANEL_HEIGHT_DEFAULT,
      actions: {
        setSidebarWidth: (width) => {
          const sidebarWidth = clamp(width, SIDEBAR_WIDTH_MIN, SIDEBAR_WIDTH_MAX)
          set((state) => (state.sidebarWidth === sidebarWidth ? state : { sidebarWidth }))
        },
        setMiddleColumnWidth: (width) => {
          const middleColumnWidth = clamp(width, MIDDLE_COLUMN_WIDTH_MIN, MIDDLE_COLUMN_WIDTH_MAX)
          set((state) =>
            state.middleColumnWidth === middleColumnWidth ? state : { middleColumnWidth },
          )
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
      version: SHELL_PANEL_PERSIST_VERSION,
      partialize: (state) => ({
        sidebarWidth: state.sidebarWidth,
        middleColumnWidth: state.middleColumnWidth,
        bottomPanelHeight: state.bottomPanelHeight,
      }),
      migrate: (persisted, version) => {
        const state = (persisted ?? {}) as PersistedShellPanel
        // v1 used MIDDLE_COLUMN_WIDTH_DEFAULT = 288; v2 default is 360.
        if (version < 2) {
          return {
            ...state,
            middleColumnWidth: MIDDLE_COLUMN_WIDTH_DEFAULT,
          }
        }
        return state
      },
    },
  ),
)

export const useSidebarWidth = () => useShellPanelStore((state) => state.sidebarWidth)

export const useMiddleColumnWidth = () => useShellPanelStore((state) => state.middleColumnWidth)

export const useBottomPanelHeight = () => useShellPanelStore((state) => state.bottomPanelHeight)

export const useShellPanelActions = () => useShellPanelStore((state) => state.actions)
