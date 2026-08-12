import { describe, expect, it } from 'bun:test'
import {
  buildWaysOverpassQuery,
  compileOverpassWaySelectors,
  matchesOsmWaySelection,
  tag,
  type OsmWaySelectionPolicy,
} from '../way-selection-policy'

const bikeFootPolicy: OsmWaySelectionPolicy = {
  include: [
    {
      all: [
        tag.oneOf('highway', [
          'cycleway',
          'path',
          'track',
          'bridleway',
          'pedestrian',
          'living_street',
          'residential',
          'unclassified',
          'tertiary',
          'secondary',
          'primary',
          'trunk',
          'service',
        ]),
      ],
    },
    {
      all: [tag.eq('highway', 'footway'), tag.neq('footway', 'sidewalk')],
    },
    {
      all: [
        tag.eq('highway', 'footway'),
        tag.eq('footway', 'sidewalk'),
        tag.oneOf('bicycle', ['yes', 'designated']),
      ],
    },
    { all: [tag.eq('highway', 'steps')] },
    { all: [tag.oneOf('bicycle', ['yes', 'designated'])] },
    { all: [tag.present('cycleway')] },
  ],
  globalAll: [tag.neq('access', 'private'), tag.neq('access', 'no')],
}

describe('compileOverpassWaySelectors', () => {
  it('emits one Overpass filter suffix per include clause with globalAll ANDed', () => {
    const selectors = compileOverpassWaySelectors(bikeFootPolicy)

    expect(selectors.length).toBe(6)
    expect(selectors[0]).toContain('[highway~"^(cycleway|')
    expect(selectors[0]).toContain('[access!=private]')
    expect(selectors[0]).toContain('[access!=no]')
    expect(selectors[1]).toBe('[highway=footway][footway!=sidewalk][access!=private][access!=no]')
    expect(selectors[2]).toBe(
      '[highway=footway][footway=sidewalk][bicycle~"^(yes|designated)$"][access!=private][access!=no]',
    )
    expect(selectors[3]).toBe('[highway=steps][access!=private][access!=no]')
  })
})

describe('matchesOsmWaySelection', () => {
  it('includes bike and foot infra, excludes private and bare sidewalks', () => {
    expect(matchesOsmWaySelection({ highway: 'cycleway' }, bikeFootPolicy)).toBe(true)
    expect(matchesOsmWaySelection({ highway: 'steps' }, bikeFootPolicy)).toBe(true)
    expect(
      matchesOsmWaySelection({ highway: 'footway', footway: 'crossing' }, bikeFootPolicy),
    ).toBe(true)
    expect(
      matchesOsmWaySelection(
        { highway: 'footway', footway: 'sidewalk', bicycle: 'yes' },
        bikeFootPolicy,
      ),
    ).toBe(true)
    expect(
      matchesOsmWaySelection({ highway: 'residential', cycleway: 'lane' }, bikeFootPolicy),
    ).toBe(true)

    expect(
      matchesOsmWaySelection({ highway: 'footway', footway: 'sidewalk' }, bikeFootPolicy),
    ).toBe(false)
    expect(matchesOsmWaySelection({ highway: 'cycleway', access: 'private' }, bikeFootPolicy)).toBe(
      false,
    )
    expect(matchesOsmWaySelection({ highway: 'path', access: 'no' }, bikeFootPolicy)).toBe(false)
  })
})

describe('buildWaysOverpassQuery', () => {
  it('builds a compact union query', () => {
    const query = buildWaysOverpassQuery(
      {
        include: [{ all: [tag.eq('highway', 'steps')] }],
        globalAll: [tag.neq('access', 'no')],
      },
      '52.5,13.4,52.51,13.41',
    )

    expect(query).toBe(
      '[out:xml][timeout:60];(way[highway=steps][access!=no](52.5,13.4,52.51,13.41););(._;>;);out meta;',
    )
  })
})
