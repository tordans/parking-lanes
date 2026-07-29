import { describe, expect, test } from 'bun:test'
import {
  fillEditorUrlTemplate,
  idEditorUrl,
  josmLoadObjectUrl,
  mapillaryRecentPanosUrl,
  mapillaryUrl,
  osmchaChangesetUrl,
  osmchaFiltersUrl,
  osmChangesetUrl,
  osmDeepHistoryUrl,
  osmDevUrl,
  osmEditIdUrl,
  osmObjectHistoryUrl,
  osmOrgUrl,
  osmProdApiUrl,
  osmProdUrl,
  serializeTildaFeaturesParam,
  TILDA_INFRA_PRESETS,
  tildaInspectorUrl,
  tildaInspectorUrlForInfra,
  tildaSourceNumericId,
} from '../index'

describe('editor links', () => {
  test('exports OSM website and API URLs', () => {
    expect(osmProdUrl).toBe('https://www.openstreetmap.org')
    expect(osmProdApiUrl).toBe('https://api.openstreetmap.org')
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

  test('mapillaryUrl builds unfiltered viewport link', () => {
    const url = mapillaryUrl({ lat: 52.52, lng: 13.405 })

    expect(url).toBe(
      'https://www.mapillary.com/app/?lat=52.52&lng=13.405&z=17&focus=map&trafficSign=all',
    )
  })

  test('mapillaryRecentPanosUrl adds 3-year date filter and panos=true', () => {
    const url = mapillaryRecentPanosUrl(
      { lat: 52.52, lng: 13.405 },
      { referenceDate: new Date('2026-07-27T12:00:00.000Z') },
    )

    expect(url).toBe(
      'https://www.mapillary.com/app/?lat=52.52&lng=13.405&z=17&focus=map&trafficSign=all&dateFrom=2023-07-27&dateTo=2026-07-27&panos=true',
    )
  })

  test('osmEditIdUrl builds official OSM.org edit link', () => {
    const url = osmEditIdUrl({
      osmType: 'way',
      osmId: 42,
      hashtags: '#TILDA',
      comment: 'fix parking',
    })
    expect(url).toContain('https://www.openstreetmap.org/edit?way=42')
    expect(url).toContain('hashtags=%23TILDA')
    expect(url).toContain('comment=fix+parking')
  })

  test('josmLoadObjectUrl builds remote-control load_object', () => {
    expect(josmLoadObjectUrl({ osmType: 'way', osmId: 99 })).toBe(
      'http://127.0.0.1:8111/load_object?objects=w99&changeset_hashtags=TILDA',
    )
  })

  test('fillEditorUrlTemplate replaces placeholders', () => {
    const url = fillEditorUrlTemplate(
      'https://example.test/{long_osm_type}/{osm_id}#{zoom}/{latitude}/{longitude}/{short_osm_type}',
      {
        zoom: 15,
        center: { lat: 50.7, lng: 7.1 },
        osmType: 'way',
        osmId: 1,
      },
    )
    expect(url).toBe('https://example.test/way/1#15/50.7/7.1/w')
  })
})

describe('changeset inspect helpers', () => {
  test('osmOrgUrl and history URLs', () => {
    expect(osmOrgUrl({ osmType: 'way', osmId: 42 })).toBe('https://www.openstreetmap.org/way/42')
    expect(osmObjectHistoryUrl({ osmType: 'way', osmId: 42 })).toBe(
      'https://www.openstreetmap.org/way/42/history',
    )
    expect(osmDeepHistoryUrl({ osmType: 'way', osmId: 42 })).toBe(
      'https://osmlab.github.io/osm-deep-history/#/way/42',
    )
    expect(osmChangesetUrl(147069026)).toBe('https://www.openstreetmap.org/changeset/147069026')
  })

  test('osmchaChangesetUrl', () => {
    expect(osmchaChangesetUrl(147069026)).toBe('https://osmcha.org/changesets/147069026')
  })
})

describe('osmcha filters', () => {
  test('osmchaFiltersUrl encodes label/value arrays', () => {
    const url = osmchaFiltersUrl({
      in_bbox: '13.3,52.4,13.5,52.6',
      date__gte: '2026-07-01',
      tag_changes: 'parking=*',
    })
    expect(url.startsWith('https://osmcha.org/?filters=')).toBe(true)
    const encoded = url.slice('https://osmcha.org/?filters='.length)
    const filters = JSON.parse(decodeURIComponent(encoded))
    expect(filters).toEqual({
      in_bbox: [{ label: '13.3,52.4,13.5,52.6', value: '13.3,52.4,13.5,52.6' }],
      date__gte: [{ label: '2026-07-01', value: '2026-07-01' }],
      tag_changes: [{ label: 'parking=*', value: 'parking=*' }],
    })
  })
})

describe('tilda inspector deeplinks', () => {
  test('source numeric ids for infra presets', () => {
    expect(tildaSourceNumericId('atlas_bikelanes')).toBe(10)
    expect(tildaSourceNumericId('lars_parking')).toBe(2)
    expect(TILDA_INFRA_PRESETS.bikelanes.regionSlug).toBe('radinfra')
    expect(TILDA_INFRA_PRESETS.parking.regionSlug).toBe('parkraum')
  })

  test('serializeTildaFeaturesParam point and bbox', () => {
    expect(
      serializeTildaFeaturesParam({
        sourceId: 'mapillary_coverage',
        featureId: '776457396685869',
        coords: { kind: 'point', lon: 13.64569, lat: 52.378193 },
      }),
    ).toBe('21|776457396685869|13.64569|52.378193')

    expect(
      serializeTildaFeaturesParam({
        sourceId: 'atlas_bikelanes',
        featureId: 'way/1010110070',
        coords: {
          kind: 'bbox',
          minLon: 13.645427,
          minLat: 52.37763,
          maxLon: 13.646221,
          maxLat: 52.378219,
        },
      }),
    ).toBe('10|way/1010110070|13.645427|52.37763|13.646221|52.378219')
  })

  test('tildaInspectorUrlForInfra bikelanes with feature', () => {
    const url = tildaInspectorUrlForInfra('bikelanes', {
      map: { zoom: 13, lat: 52.4989, lng: 13.4329 },
      featureId: 'way/964321958',
      coords: {
        kind: 'bbox',
        minLon: 13.414382,
        minLat: 52.487661,
        maxLon: 13.419178,
        maxLat: 52.488275,
      },
    })
    expect(url).toContain('https://tilda-geo.de/regionen/radinfra?')
    expect(url).toContain('map=13%2F52.4989%2F13.4329')
    expect(url).toContain('config=1v92rco.7h39.4pt3i8')
    expect(url).toContain('f=10%7Cway%2F964321958%7C13.414382%7C52.487661%7C13.419178%7C52.488275')
    expect(url).toContain('v=2')
  })

  test('tildaInspectorUrlForInfra parking matches parkraum example shape', () => {
    const url = tildaInspectorUrlForInfra('parking', {
      map: { zoom: 15, lat: 50.711, lng: 7.0917 },
      featureId: 559303,
      coords: {
        kind: 'bbox',
        minLon: 7.087957,
        minLat: 50.712638,
        maxLon: 7.088188,
        maxLat: 50.713781,
      },
    })
    expect(url).toContain('/regionen/parkraum?')
    expect(url).toContain('config=12nl2cs.16lxxh')
    expect(url).toContain('f=2%7C559303%7C7.087957%7C50.712638%7C7.088188%7C50.713781')
  })

  test('viewport-only parkraum link omits f', () => {
    const url = tildaInspectorUrl({
      regionSlug: 'parkraum',
      map: { zoom: 15, lat: 50.711, lng: 7.0917 },
      config: TILDA_INFRA_PRESETS.parking.defaultConfig,
    })
    expect(url).toContain('/regionen/parkraum?')
    expect(url).not.toContain('f=')
    expect(url).toContain('v=2')
  })
})
