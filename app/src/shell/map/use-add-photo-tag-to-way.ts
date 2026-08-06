import * as m from '@app/paraglide/messages'
import { nestSideTags } from '@osm-editor-kit/osm-sidepath-tags'
import { useQueryClient } from '@tanstack/react-query'
import { useParams } from '@tanstack/react-router'
import type { StreetSpaceModeId } from '../../modes/types'
import { useSelectedOsmRef } from './feature-selection-store'
import { recordEditingImagery } from './imagery-usage-session'
import { commitOsmWayChange, getOsmWayFromSession } from './osm-session-way-edits'
import { photoTagKey, resolvePhotoTagContext } from './photo-tag-key'
import type { PhotoSearchSelection } from './street-imagery-search-params'
import { streetImageryUsedLabel } from './street-imagery-search-params'

export function useAddPhotoTagToWay() {
  const queryClient = useQueryClient()
  const { mode: modeSlug } = useParams({ from: '/$mode' })
  const selectedOsmRef = useSelectedOsmRef()

  return (photo: PhotoSearchSelection) => {
    if (selectedOsmRef?.type !== 'way') return

    const way = getOsmWayFromSession(queryClient, selectedOsmRef.id)
    if (!way) return

    const context = resolvePhotoTagContext(photo.provider, selectedOsmRef, modeSlug)
    const key = photoTagKey(context)

    let nextTags = { ...way.tags }

    if (context.kind === 'way') {
      nextTags = { ...nextTags, [key]: photo.photoId }
    } else if (context.kind === 'parking-side') {
      nextTags = { ...nextTags, [key]: photo.photoId }
    } else {
      nextTags = nestSideTags(nextTags, context.prefix, context.side, {
        [context.provider]: photo.photoId,
      })
    }

    commitOsmWayChange(queryClient, { ...way, tags: nextTags }, modeSlug as StreetSpaceModeId)
    recordEditingImagery(undefined, streetImageryUsedLabel[photo.provider])
  }
}

export function useResolvedPhotoTagLabel(photo: PhotoSearchSelection | undefined): string | null {
  const { mode: modeSlug } = useParams({ from: '/$mode' })
  const selectedOsmRef = useSelectedOsmRef()
  if (!photo) return null
  const context = resolvePhotoTagContext(photo.provider, selectedOsmRef, modeSlug)
  return photoTagKey(context)
}

export function usePhotoTagButtonLabel(photo: PhotoSearchSelection | undefined): string {
  const key = useResolvedPhotoTagLabel(photo)
  if (!key) return m.street_imagery_add_tag()
  return m.street_imagery_add_tag_key({ key })
}
