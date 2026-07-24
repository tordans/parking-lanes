import { useCallback, useEffect } from 'react'
import { authenticate, logout, restoreSession, userInfo } from '../../../lib/osm-client'
import { toast } from '../../../lib/toast'
import { AuthState, useAppActions, useAuthState, useMapBounds } from '../../../shell/app-store'
import { useUseOsmDevServer } from '../../../shell/debug-settings-store'
import { useMapViewport } from '../../../shell/map/map-viewport'
import { clearChanges } from '../../../utils/changes-store'
import { viewMinZoom } from './constants'
import { useParkingOsmFetch } from './use-parking-osm-fetch'

function clearOauthCallbackSearchParams(): void {
  if (!window.location.search.includes('code=')) return

  const url = new URL(window.location.href)
  url.search = ''
  window.history.replaceState({}, '', `${url.pathname}${url.hash}`)
}

let devSessionRestoreStarted = false

export function useOsmAuth() {
  const authState = useAuthState()
  const mapBounds = useMapBounds()
  const { zoom } = useMapViewport()
  const useDevServer = useUseOsmDevServer()
  const { loadParkingData } = useParkingOsmFetch()
  const { setAuthState, setOsmDisplayName, setChangesCount } = useAppActions()

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
    if (
      import.meta.env.DEV !== true ||
      authState === AuthState.success ||
      devSessionRestoreStarted
    ) {
      return
    }

    devSessionRestoreStarted = true

    void (async () => {
      try {
        const loggedIn = await restoreSession(useDevServer)
        if (!loggedIn) return

        const applied = await applyLoggedInState()
        if (applied) clearOauthCallbackSearchParams()
      } catch (err) {
        toast.fromError(err, 'OSM login failed')
      }
    })()
  }, [applyLoggedInState, authState, useDevServer])

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
    setChangesCount(clearChanges())
  }, [setAuthState, setChangesCount, setOsmDisplayName])

  return { login, logout: logoutUser, authState }
}
