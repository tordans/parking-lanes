import { describe, expect, it } from 'bun:test'
import type { NormalizedPhoto } from '../providers/model'
import { dedupeNearbyPhotos, findNearestPhoto, groupClickedPhotos } from './groupClickedPhotos'

const photo = (
  overrides: Partial<NormalizedPhoto> & Pick<NormalizedPhoto, 'photoId' | 'lngLat'>,
): NormalizedPhoto => ({
  providerId: 'mapillary',
  sequenceId: 'seq-a',
  capturedAt: 1_700_000_000_000,
  isPano: true,
  heading: 90,
  ...overrides,
})

describe('findNearestPhoto', () => {
  it('picks the closest photo to the click', () => {
    const candidates = [
      photo({ photoId: 'far', lngLat: [13.41, 52.52] }),
      photo({ photoId: 'near', lngLat: [13.4051, 52.5201] }),
    ]

    expect(findNearestPhoto(candidates, 13.405, 52.52)?.photoId).toBe('near')
  })
})

describe('dedupeNearbyPhotos', () => {
  it('drops photos within 5 m of an earlier photo in the sequence', () => {
    const deduped = dedupeNearbyPhotos([
      photo({ photoId: '1', lngLat: [13.405, 52.52], capturedAt: 1 }),
      photo({ photoId: '2', lngLat: [13.4050003, 52.5200003], capturedAt: 2 }),
      photo({ photoId: '3', lngLat: [13.406, 52.521], capturedAt: 3 }),
    ])

    expect(deduped.map((item) => item.photoId)).toEqual(['1', '3'])
  })
})

describe('groupClickedPhotos', () => {
  it('groups by provider and sequence, sorts by distance, and orders photos by capture time', () => {
    const groups = groupClickedPhotos(
      [
        photo({
          providerId: 'panoramax',
          sequenceId: 'px-1',
          photoId: 'p2',
          capturedAt: 2,
          lngLat: [13.4052, 52.5202],
        }),
        photo({
          providerId: 'panoramax',
          sequenceId: 'px-1',
          photoId: 'p1',
          capturedAt: 1,
          lngLat: [13.4051, 52.5201],
        }),
        photo({
          providerId: 'kartaview',
          sequenceId: null,
          photoId: 'solo',
          capturedAt: 3,
          lngLat: [13.40505, 52.52005],
        }),
      ],
      13.405,
      52.52,
    )

    expect(groups).toHaveLength(2)
    expect(groups[0]?.providerId).toBe('kartaview')
    expect(groups[0]?.sequenceId).toBe('photo:solo')
    expect(groups[1]?.photos.map((item) => item.photoId)).toEqual(['p1', 'p2'])
  })
})
