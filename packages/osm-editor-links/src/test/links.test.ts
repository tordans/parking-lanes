import { describe, expect, test } from 'bun:test'
import { idEditorUrl, osmDevUrl, osmProdUrl } from '../index'

describe('editor links', () => {
  test('exports OSM website URLs', () => {
    expect(osmProdUrl).toBe('https://www.openstreetmap.org')
    expect(osmDevUrl).toBe('https://master.apis.dev.openstreetmap.org')
  })

  test('idEditorUrl builds hash params for selected object', () => {
    const url = idEditorUrl({
      center: { lat: 52.5, lng: 13.4 },
      zoom: 18,
      osmObjectType: 'way',
      osmObjectId: 42,
    })

    expect(url).toContain('#')
    expect(url).toContain('id=w42')
    expect(url).toContain('map=18%2F52.5%2F13.4')
  })
})
