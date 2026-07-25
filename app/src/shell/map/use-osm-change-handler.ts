import type { OsmWay } from '@osm-editor-kit/osm-data'
import { useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import type { ChangeSource } from '../../utils/changeset-message'
import { AuthState, useAuthState } from '../app-store'
import { commitOsmWayChange } from './osm-session-way-edits'

/** Shared OSM edit commit for all modes — one session graph + one pending changes store. */
export function useOsmChangeHandler(source: ChangeSource) {
  const queryClient = useQueryClient()
  const authState = useAuthState()

  return useCallback(
    (newOsm: OsmWay) => {
      if (authState !== AuthState.success) return
      commitOsmWayChange(queryClient, newOsm, source)
    },
    [authState, queryClient, source],
  )
}
