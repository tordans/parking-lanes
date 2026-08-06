import type { ProviderId } from '@osm-editor-kit/street-imagery'

export type StreetImageryPhotoSelection = {
  provider: ProviderId
  sequenceId: string
  photoId: string
}
