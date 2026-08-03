import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const SIDEBAR_WIDTH_DEFAULT = 384
export const SIDEBAR_WIDTH_MIN = 288
export const SIDEBAR_WIDTH_MAX = 576

export const MIDDLE_COLUMN_WIDTH_DEFAULT = 360
export const MIDDLE_COLUMN_WIDTH_MIN = 240
export const MIDDLE_COLUMN_WIDTH_MAX = 480

/** Bump when persisted defaults change so migrations can reset stale values. */
const SHELL_PANEL_PERSIST_VERSION = 3

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(value)))
}

interface ShellPanelStore {
  sidebarWidth: number
  middleColumnWidth: number
  actions: {
    setSidebarWidth: (width: number) => void
    setMiddleColumnWidth: (width: number) => void
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
      },
    }),
    {
      name: 'street-space-shell-panel',
      version: SHELL_PANEL_PERSIST_VERSION,
      partialize: (state) => ({
        sidebarWidth: state.sidebarWidth,
        middleColumnWidth: state.middleColumnWidth,
      }),
      migrate: (persisted, version) => {
        const state = (persisted ?? {}) as PersistedShellPanel
        // v1 used MIDDLE_COLUMN_WIDTH_DEFAULT = 288; v2 default is 360.
        // v3 drops bottomPanelHeight (bottom editor slot removed).
        if (version < 2) {
          return {
            sidebarWidth: state.sidebarWidth,
            middleColumnWidth: MIDDLE_COLUMN_WIDTH_DEFAULT,
          }
        }
        return {
          sidebarWidth: state.sidebarWidth,
          middleColumnWidth: state.middleColumnWidth,
        }
      },
    },
  ),
)

export const useSidebarWidth = () => useShellPanelStore((state) => state.sidebarWidth)

export const useMiddleColumnWidth = () => useShellPanelStore((state) => state.middleColumnWidth)

export const useShellPanelActions = () => useShellPanelStore((state) => state.actions)
