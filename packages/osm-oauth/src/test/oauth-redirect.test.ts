import { beforeEach, describe, expect, mock, test } from 'bun:test'
import {
  clearOauthCallbackSearchParams,
  pickOauthCallbackSearch,
  saveOAuthReturnUrl,
  OSM_AUTH_RETURN_URL_KEY,
} from '../oauth-redirect'

const memoryStorage = new Map<string, string>()
const localStorageMock = {
  getItem: (key: string) => memoryStorage.get(key) ?? null,
  setItem: (key: string, value: string) => {
    memoryStorage.set(key, value)
  },
  removeItem: (key: string) => {
    memoryStorage.delete(key)
  },
  clear: () => {
    memoryStorage.clear()
  },
}

describe('oauth-redirect helpers', () => {
  beforeEach(() => {
    memoryStorage.clear()
    ;(globalThis as { localStorage: typeof localStorageMock }).localStorage = localStorageMock
  })

  test('saveOAuthReturnUrl stores path search and hash', () => {
    global.window = {
      location: {
        pathname: '/street-space-editor/parking',
        search: '?map=16/52.5/13.4&f=way/42',
        hash: '',
      },
    } as Window & typeof globalThis

    saveOAuthReturnUrl()
    expect(localStorage.getItem(OSM_AUTH_RETURN_URL_KEY)).toBe(
      '/street-space-editor/parking?map=16/52.5/13.4&f=way/42',
    )
  })

  test('pickOauthCallbackSearch extracts callback keys only', () => {
    expect(pickOauthCallbackSearch('?map=16/1/2&code=abc&state=xyz&f=way/1')).toEqual({
      code: 'abc',
      state: 'xyz',
    })
  })

  test('clearOauthCallbackSearchParams keeps map deep-link params', () => {
    const replaceState = mock(() => undefined)
    global.window = {
      location: {
        href: 'http://127.0.0.1:33444/street-space-editor/parking?map=16/52.5/13.4&f=way/42&code=abc&state=xyz',
      },
      history: { replaceState },
    } as unknown as Window & typeof globalThis

    clearOauthCallbackSearchParams()

    expect(replaceState).toHaveBeenCalledTimes(1)
    const nextUrl = String(replaceState.mock.calls[0]?.[2])
    expect(nextUrl).not.toContain('code=')
    expect(nextUrl).not.toContain('state=')
    expect(decodeURIComponent(nextUrl)).toContain('map=16/52.5/13.4')
    expect(decodeURIComponent(nextUrl)).toContain('f=way/42')
  })
})
