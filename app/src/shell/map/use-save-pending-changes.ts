import { useQueryClient } from '@tanstack/react-query'
import { useParams } from '@tanstack/react-router'
import { useMap } from 'react-map-gl/maplibre'
import { APP_NAME, APP_VERSION } from '../../lib/app-identity'
import { OsmApiRequestError, uploadChanges } from '../../lib/osm-client'
import { toast } from '../../lib/toast'
import { getMapSizePx, useParkingCoveragePace, viewMinZoom } from '../../modes/parking'
import type { StreetSpaceModeId } from '../../modes/types'
import { useWidthCoveragePace, viewMinZoom as widthViewMinZoom } from '../../modes/width'
import { changesStore, clearChanges, removeChangedEntity } from '../../utils/changes-store'
import { useMapBounds } from '../app-store'
import { useFeatureSelection, useSelectedOsmRef } from './feature-selection'
import { MAIN_MAP_ID } from './map-ids'
import { useMapViewport } from './map-viewport'
import {
  remapOsmNodeIdInSession,
  remapOsmWayIdInSession,
  removeOsmWayFromSession,
  restoreOsmWayInSession,
} from './osm-session-way-edits'

export function useSavePendingChanges() {
  const queryClient = useQueryClient()
  const mapBounds = useMapBounds()
  const { zoom: mapZoom } = useMapViewport()
  const { mode: modeSlug } = useParams({ from: '/$mode' })
  const resolvedModeId = modeSlug as StreetSpaceModeId
  const isWidthMode = resolvedModeId === 'width'
  const parkingCoverage = useParkingCoveragePace(!isWidthMode)
  const widthCoverage = useWidthCoveragePace(isWidthMode)
  const { refetchAfterSave } = isWidthMode ? widthCoverage : parkingCoverage
  const minZoom = isWidthMode ? widthViewMinZoom : viewMinZoom
  const maps = useMap()
  const mainMap = maps[MAIN_MAP_ID]
  const selectedOsmRef = useSelectedOsmRef()
  const { updateFeatureRef } = useFeatureSelection()

  async function handleSave(comment: string) {
    try {
      const changedIdMap = await uploadChanges(APP_NAME, APP_VERSION, changesStore, { comment })
      for (const oldId in changedIdMap) {
        const newId = changedIdMap[oldId]!
        const remappedWay = remapOsmWayIdInSession(queryClient, Number(oldId), Number(newId))
        remapOsmNodeIdInSession(queryClient, Number(oldId), Number(newId))

        if (selectedOsmRef?.type === 'way' && selectedOsmRef.id === Number(oldId) && remappedWay) {
          updateFeatureRef({
            type: 'way',
            id: remappedWay.id,
            ...(selectedOsmRef.prefix != null && selectedOsmRef.side != null
              ? { prefix: selectedOsmRef.prefix, side: selectedOsmRef.side }
              : {}),
          })
        }
      }
      clearChanges()

      if (mapBounds && mapZoom >= minZoom) {
        const maplibreMap = mainMap?.getMap()
        const sizePx = maplibreMap ? getMapSizePx(maplibreMap) : undefined
        await refetchAfterSave(mapBounds, mapZoom, sizePx)
      }
    } catch (err) {
      if (err instanceof OsmApiRequestError) toast.error(err.responseText || err.message)
      else toast.fromError(err, 'Could not save changes')
      throw err
    }
  }

  function handleDiscardWay(wayId: number, result: ReturnType<typeof removeChangedEntity>) {
    if (result.wasCreate) {
      removeOsmWayFromSession(queryClient, wayId)
      return
    }
    if (result.original) {
      restoreOsmWayInSession(queryClient, result.original)
    }
  }

  return { handleSave, handleDiscardWay }
}
