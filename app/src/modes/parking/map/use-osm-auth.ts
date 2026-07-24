import { useCallback } from 'react'
import { authenticate, logout, userInfo } from '../../../lib/osm-client'
import { AuthState, useAppActions, useAuthState, useMapBounds } from '../../../shell/app-store'
import { useMapViewport } from '../../../shell/map/map-viewport'
import { clearChanges } from '../../../utils/changes-store'
import { viewMinZoom } from './constants'
import { useParkingOsmFetch } from './use-parking-osm-fetch'

const useDevServer = false

export function useOsmAuth() {
  const authState = useAuthState()
  const mapBounds = useMapBounds()
  const { zoom } = useMapViewport()
  const { loadParkingData } = useParkingOsmFetch()
  const { setAuthState, setOsmDisplayName, setChangesCount } = useAppActions()

  const login = useCallback(async () => {
    try {
      await authenticate(useDevServer)
      let displayName: string | null = null
      try {
        const info = await userInfo()
        displayName = info.display_name ?? null
      } catch {
        logout()
        await authenticate(useDevServer)
        const info = await userInfo()
        displayName = info.display_name ?? null
      }
      setOsmDisplayName(displayName)
      setAuthState(AuthState.success)
      if (mapBounds && zoom >= viewMinZoom) {
        await loadParkingData(mapBounds, zoom)
      }
    } catch (err) {
      setAuthState(AuthState.fail)
      alert(err)
    }
  }, [loadParkingData, mapBounds, setAuthState, setOsmDisplayName, zoom])

  const logoutUser = useCallback(() => {
    logout()
    setAuthState(AuthState.initial)
    setOsmDisplayName(null)
    setChangesCount(clearChanges())
  }, [setAuthState, setChangesCount, setOsmDisplayName])

  return { login, logout: logoutUser, authState }
}
