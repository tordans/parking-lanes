import { routerSearch } from '../utils/router-search'

describe('router search serialization', () => {
  test('map param round-trips with readable slashes', () => {
    const map = '16.1/52.4751/13.4436'
    const serialized = routerSearch.stringify({ map })
    expect(serialized).not.toContain('%2F')
    expect(serialized).toContain('map=16.1/52.4751/13.4436')

    const parsed = routerSearch.parse(serialized)
    expect(parsed.map).toBe(map)
  })
})
