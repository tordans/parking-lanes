import { useCallback } from 'react'
import { authenticate, logout, userInfo } from '../../../lib/osm-client'
import { toast } from '../../../lib/toast'
import { AuthState, useAppActions, useAuthState, useMapBounds } from '../../../shell/app-store'
import { useUseOsmDevServer } from '../../../shell/debug-settings-store'
import { useMapViewport } from '../../../shell/map/map-viewport'
import { clearChanges } from '../../../utils/changes-store'
import { viewMinZoom } from './constants'
import { useParkingOsmFetch } from './use-parking-osm-fetch'

export function useOsmAuth() {
  const authState = useAuthState()
  const mapBounds = useMapBounds()
  const { zoom } = useMapViewport()
  const useDevServer = useUseOsmDevServer()
  const { loadParkingData } = useParkingOsmFetch()
  const { setAuthState, setOsmDisplayName, setChangesCount } = useAppActions()

  const login = useCallback(async () => {
    try {
      await authenticate(useDevServer)

      let displayName: string | null = null
      try {
        const info = await userInfo()
        displayName = info.display_name ?? null
      } catch (firstError) {
        try {
          const info = await userInfo()
          displayName = info.display_name ?? null
        } catch (retryError) {
          logout()
          setAuthState(AuthState.fail)
          toast.fromError(retryError ?? firstError, 'Could not load your OSM profile after login')
          return
        }
      }

      setOsmDisplayName(displayName)
      setAuthState(AuthState.success)
      if (mapBounds && zoom >= viewMinZoom) {
        await loadParkingData(mapBounds, zoom)
      }
    } catch (err) {
      setAuthState(AuthState.fail)
      toast.fromError(err, 'OSM login failed')
    }
  }, [loadParkingData, mapBounds, setAuthState, setOsmDisplayName, useDevServer, zoom])

  const logoutUser = useCallback(() => {
    logout()
    setAuthState(AuthState.initial)
    setOsmDisplayName(null)
    setChangesCount(clearChanges())
  }, [setAuthState, setChangesCount, setOsmDisplayName])

  return { login, logout: logoutUser, authState }
}
