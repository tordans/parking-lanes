import { describe, expect, it } from 'bun:test'
import { buildStreetsidePreviewUrl } from './streetsidePreview'

describe('buildStreetsidePreviewUrl', () => {
  it('substitutes template placeholders for a single face tile', () => {
    expect(
      buildStreetsidePreviewUrl(
        'https://ecn.{subdomain}.tiles.virtualearth.net/tiles/hs1032000332102312{faceId}{tileId}?g=15580',
      ),
    ).toBe('https://ecn.t0.tiles.virtualearth.net/tiles/hs103200033210231201?g=15580')
  })

  it('returns null when template is missing', () => {
    expect(buildStreetsidePreviewUrl(undefined)).toBeNull()
    expect(buildStreetsidePreviewUrl('https://example.com/static.jpg')).toBeNull()
  })
})
