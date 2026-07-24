import { type OsmWay } from '@osm-editor-kit/osm-data'
import { countChanges, upsertChangedWay } from '../changes'
import { type ChangesStore } from '../changes-store'

function createWay(id: number): OsmWay {
  return {
    id,
    type: 'way',
    version: 1,
    changeset: 1,
    nodes: [1, 2],
    tags: {},
  }
}

describe('changes store helpers', () => {
  test('upsertChangedWay adds and updates modify entries for positive ids', () => {
    const store: ChangesStore = { modify: { way: [] }, create: { way: [] } }
    const way = createWay(42)

    upsertChangedWay(store, way)
    expect(store.modify.way).toHaveLength(1)
    expect(countChanges(store)).toBe(1)

    const updatedWay = { ...way, tags: { highway: 'residential' } }
    upsertChangedWay(store, updatedWay)
    expect(store.modify.way).toHaveLength(1)
    expect(store.modify.way[0].tags.highway).toBe('residential')
  })

  test('upsertChangedWay tracks negative ids in create bucket', () => {
    const store: ChangesStore = { modify: { way: [] }, create: { way: [] } }
    const way = createWay(-1)

    upsertChangedWay(store, way)
    expect(store.create.way).toHaveLength(1)
    expect(store.modify.way).toHaveLength(0)
    expect(countChanges(store)).toBe(1)
  })
})
