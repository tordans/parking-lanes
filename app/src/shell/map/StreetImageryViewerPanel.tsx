import * as m from '@app/paraglide/messages'
import {
  StreetLevelImageryViewer,
  useViewerActions,
  type StreetImageryPhotoSelection,
} from '@osm-editor-kit/street-imagery-react'
import { useSearch } from '@tanstack/react-router'
import { X } from 'lucide-react'
import { useEffect } from 'react'
import { useMap } from 'react-map-gl/maplibre'
import { Button } from '../../components/catalyst/button'
import { useSelectedOsmRef } from './feature-selection-store'
import { MAIN_MAP_ID } from './map-ids'
import { isEditorPhotoProvider } from './street-imagery-search-params'
import { useAddPhotoTagToWay, usePhotoTagButtonLabel } from './use-add-photo-tag-to-way'
import { useModeSearchNavigation } from './use-mode-search-navigation'
import { useSelectedPhotoForMap } from './use-selected-photo-for-map'

export function StreetImageryViewerPanel() {
  const { photo } = useSearch({ from: '/$mode' })
  const { updateSearch } = useModeSearchNavigation()
  const { selectedPhoto, groupPhotos } = useSelectedPhotoForMap()
  const selectedOsmRef = useSelectedOsmRef()
  const addPhotoTag = useAddPhotoTagToWay()
  const tagButtonLabel = usePhotoTagButtonLabel(photo)
  const { reset } = useViewerActions()
  const maps = useMap()
  const map = maps[MAIN_MAP_ID]

  useEffect(
    function resetViewerPovOnClose() {
      if (photo) return
      reset()
    },
    [photo, reset],
  )

  if (!photo || !selectedPhoto) return null

  const handlePhotoSelected = (selection: StreetImageryPhotoSelection) => {
    if (!isEditorPhotoProvider(selection.provider)) return
    updateSearch(
      {
        photo: {
          provider: selection.provider,
          photoId: selection.photoId,
          sequenceId: selection.sequenceId,
        },
      },
      { replace: true },
    )
  }

  const handleEaseMapToPoint = (lng: number, lat: number) => {
    map?.easeTo({ center: [lng, lat], duration: 300 })
  }

  const handleClose = () => {
    updateSearch({ photo: undefined }, { replace: true })
  }

  return (
    <div className="flex w-[min(22rem,calc(100vw-5rem))] flex-col overflow-hidden rounded-lg bg-white/95 shadow-xs ring-1 ring-zinc-950/5 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-2 border-b border-zinc-950/5 px-2 py-1.5">
        <h2 className="text-sm font-semibold text-zinc-900">{m.street_imagery_panel_title()}</h2>
        <button
          type="button"
          className="rounded-md p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
          aria-label={m.shell_close()}
          onClick={handleClose}
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
      <div className="max-h-[min(24rem,50dvh)] overflow-y-auto p-2">
        <StreetLevelImageryViewer
          photo={selectedPhoto}
          groupPhotos={groupPhotos}
          onEaseMapToPoint={handleEaseMapToPoint}
          onPhotoSelected={handlePhotoSelected}
        />
        <p className="mt-2 text-xs text-amber-800">{m.street_imagery_id_precision_caveat()}</p>
      </div>
      {selectedOsmRef?.type === 'way' ? (
        <div className="border-t border-zinc-950/5 p-2">
          <Button type="button" className="w-full" onClick={() => photo && addPhotoTag(photo)}>
            {tagButtonLabel}
          </Button>
        </div>
      ) : null}
    </div>
  )
}
