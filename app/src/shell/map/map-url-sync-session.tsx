import {
  createContext,
  useContext,
  useLayoutEffect,
  useRef,
  type ReactNode,
  type RefObject,
} from 'react'

const MapUrlSyncSessionContext = createContext<RefObject<boolean> | null>(null)

/** Guards map-driven `?map=` URL writes while MapPage is tearing down. */
export function MapUrlSyncSessionProvider({ children }: { children: ReactNode }) {
  const activeRef = useRef(true)
  useLayoutEffect(() => {
    activeRef.current = true
    return () => {
      activeRef.current = false
    }
  }, [])

  return (
    <MapUrlSyncSessionContext.Provider value={activeRef}>
      {children}
    </MapUrlSyncSessionContext.Provider>
  )
}

export function useMapUrlSyncSessionActive(): () => boolean {
  const ref = useContext(MapUrlSyncSessionContext)
  if (!ref) return () => false
  return () => ref.current
}
