import { useSyncExternalStore } from 'react'

// https://tailwindcss.com/docs/screens
const screens = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const

export type Breakpoint = keyof typeof screens

export function useBreakpoint(breakpoint: Breakpoint) {
  return useSyncExternalStore(
    (onStoreChange) => {
      const mediaQuery = window.matchMedia(`(min-width: ${screens[breakpoint]})`)
      mediaQuery.addEventListener('change', onStoreChange)
      return () => mediaQuery.removeEventListener('change', onStoreChange)
    },
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia(`(min-width: ${screens[breakpoint]})`).matches,
    () => false,
  )
}
