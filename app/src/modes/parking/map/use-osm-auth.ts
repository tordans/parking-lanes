import { clearOauthCallbackSearchParams } from '@osm-editor-kit/osm-oauth'
import { useCallback, useEffect } from 'react'
import { authenticate, logout, restoreSession, userInfo } from '../../../lib/osm-client'
import { toast } from '../../../lib/toast'
import { AuthState, useAppActions, useAuthState, useMapBounds } from '../../../shell/app-store'
import {
  readUseOsmDevServerFromStorage,
  useUseOsmDevServer,
} from '../../../shell/debug-settings-store'
import { useMapViewport } from '../../../shell/map/map-viewport'
import { clearChanges } from '../../../utils/changes-store'
import { viewMinZoom } from './constants'
import { useParkingOsmFetch } from './use-parking-osm-fetch'

/** One restore attempt per full page load (survives StrictMode remount). */
let sessionRestoreStarted = false

export function useOsmAuth() {
  const authState = useAuthState()
  const mapBounds = useMapBounds()
  const { zoom } = useMapViewport()
  const useDevServer = useUseOsmDevServer()
  const { loadParkingData } = useParkingOsmFetch()
  const { setAuthState, setOsmDisplayName } = useAppActions()

  const applyLoggedInState = useCallback(async () => {
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
        return false
      }
    }

    setOsmDisplayName(displayName)
    setAuthState(AuthState.success)
    if (mapBounds && zoom >= viewMinZoom) {
      await loadParkingData(mapBounds, zoom)
    }
    return true
  }, [loadParkingData, mapBounds, setAuthState, setOsmDisplayName, zoom])

  useEffect(() => {
    if (authState === AuthState.success || sessionRestoreStarted) return

    sessionRestoreStarted = true

    void (async () => {
      try {
        const loggedIn = await restoreSession(readUseOsmDevServerFromStorage())
        if (!loggedIn) return

        const applied = await applyLoggedInState()
        if (applied) clearOauthCallbackSearchParams()
      } catch (err) {
        toast.fromError(err, 'OSM login failed')
      }
    })()
  }, [applyLoggedInState, authState])

  const login = useCallback(async () => {
    try {
      await authenticate(useDevServer)
      await applyLoggedInState()
    } catch (err) {
      setAuthState(AuthState.fail)
      toast.fromError(err, 'OSM login failed')
    }
  }, [applyLoggedInState, setAuthState, useDevServer])

  const logoutUser = useCallback(() => {
    logout()
    setAuthState(AuthState.initial)
    setOsmDisplayName(null)
    clearChanges()
  }, [setAuthState, setOsmDisplayName])

  return { login, logout: logoutUser, authState }
}
