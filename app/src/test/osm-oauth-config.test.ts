import { describe, expect, test } from 'bun:test'
import { getOsmOAuthRedirectUrl, OSM_OAUTH_LAND_FILENAME } from '../lib/osmOAuthConfig'

describe('getOsmOAuthRedirectUrl', () => {
  test('keeps Vite project base when the SPA path has no trailing slash', () => {
    expect(getOsmOAuthRedirectUrl('https://osmberlin.github.io', '/street-space-editor/')).toBe(
      `https://osmberlin.github.io/street-space-editor/${OSM_OAUTH_LAND_FILENAME}`,
    )
  })

  test('works when BASE_URL has no trailing slash', () => {
    expect(getOsmOAuthRedirectUrl('https://osmberlin.github.io', '/street-space-editor')).toBe(
      `https://osmberlin.github.io/street-space-editor/${OSM_OAUTH_LAND_FILENAME}`,
    )
  })

  test('dev server base under 127.0.0.1', () => {
    expect(getOsmOAuthRedirectUrl('http://127.0.0.1:33444', '/street-space-editor/')).toBe(
      `http://127.0.0.1:33444/street-space-editor/${OSM_OAUTH_LAND_FILENAME}`,
    )
  })
})
