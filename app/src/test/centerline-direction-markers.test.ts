import { describe, expect, test } from 'bun:test'
import { featureCollection, lineString } from '@turf/helpers'
import length from '@turf/length'
import {
  buildCenterlineDirectionMarkers,
  CENTERLINE_DIRECTION_MARKER_SPACING_M,
  signedCenterlineOffsetMeters,
} from '../shell/map/build-centerline-direction-markers'

describe('signedCenterlineOffsetMeters', () => {
  test('offsets sidepaths from parent road width', () => {
    expect(
      signedCenterlineOffsetMeters({
        kind: 'sidepath',
        side: 'right',
        parentRoadWidthM: 10,
      }),
    ).toBe(5)
    expect(
      signedCenterlineOffsetMeters({
        kind: 'sidepath',
        side: 'left',
        parentRoadWidthM: 10,
      }),
    ).toBe(-5)
  })

  test('uses unsigned offsetMeters when present', () => {
    expect(
      signedCenterlineOffsetMeters({
        side: 'right',
        offsetMeters: 8,
      }),
    ).toBe(8)
  })
})

describe('buildCenterlineDirectionMarkers', () => {
  test('places markers every 20 m along a long line', () => {
    const line = lineString([
      [13.4, 52.5],
      [13.4, 52.502],
    ])
    const totalM = length(line, { units: 'meters' })
    expect(totalM).toBeGreaterThan(CENTERLINE_DIRECTION_MARKER_SPACING_M)

    const markers = buildCenterlineDirectionMarkers(featureCollection([line]))
    expect(markers.features.length).toBeGreaterThanOrEqual(2)
    for (const marker of markers.features) {
      expect(marker.properties?.bearing).toBeTypeOf('number')
    }
  })

  test('places one marker on short segments', () => {
    const line = lineString([
      [13.4, 52.5],
      [13.4, 52.50003],
    ])
    const markers = buildCenterlineDirectionMarkers(featureCollection([line]))
    expect(markers.features).toHaveLength(1)
  })
})
