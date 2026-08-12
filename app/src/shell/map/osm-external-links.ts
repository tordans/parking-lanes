import * as m from '@app/paraglide/messages'
import { overpassDeUrl } from '@osm-editor-kit/osm-coverage'
import type { LatLngLiteral, MapBounds, OsmNode, OsmWay } from '@osm-editor-kit/osm-data'
import {
  idEditorUrl,
  josmUrl,
  mapillaryRecentPanosUrl,
  mapillaryUrl,
  osmchaChangesetUrl,
  osmchaFiltersUrl,
  osmChangesetUrl,
  osmDeepHistoryUrl,
  osmOrgUrl,
  osmProdUrl,
  tildaInspectorUrlForInfra,
  type TildaFeatureCoord,
  type TildaInfra,
} from '@osm-editor-kit/osm-editor-links'
import type { OsmFeatureRef } from '@osm-editor-kit/osm-map-url'
import type { HighwayInclusionStyle } from '@osm-editor-kit/osm-way-chain'
import { compileOverpassWaySelectors } from '@osm-editor-kit/osm-way-chain'
import axios from 'axios'
import type { StreetSpaceModeId } from '../../modes/types'
import { streetSpaceWayPolicy } from './street-space-way-policy'

export type MapViewportSnapshot = {
  center: LatLngLiteral
  zoom: number
  bounds: MapBounds | null
}

export type OsmExternalLink = {
  id: string
  label: string
  href: string | null
  group: 'view' | 'changeset' | 'selection' | 'viewport'
  /** Selection-scoped links stay visible but disabled when nothing is selected. */
  requiresSelection: boolean
  /** JOSM remote-control links need a special click handler. */
  josm?: boolean
}

/** Map parking-lanes modes to TILDA infra presets; roads modes have no public region. */
export function tildaInfraForMode(mode: StreetSpaceModeId): TildaInfra | null {
  if (mode === 'bicycle') return 'bikelanes'
  if (mode === 'parking') return 'parking'
  return null
}

export function buildOsmObjectUrl(ref: OsmFeatureRef) {
  return osmOrgUrl({ osmType: ref.type, osmId: ref.id }) ?? `${osmProdUrl}/${ref.type}/${ref.id}`
}

export function buildSelectedIdEditorUrl(ref: OsmFeatureRef) {
  return idEditorUrl({ osmObjectType: ref.type, osmObjectId: ref.id })
}

export function buildSelectedJosmUrl(ref: OsmFeatureRef) {
  if (ref.type !== 'way') return null
  return josmUrl + overpassDeUrl + compactOverpassQuery(getWayWithRelationsOverpassQuery(ref.id))
}

export function buildViewportIdEditorUrl(viewport: MapViewportSnapshot) {
  return idEditorUrl({
    zoom: viewport.zoom,
    center: viewport.center,
  })
}

export function buildViewportJosmUrl(
  viewport: MapViewportSnapshot,
  inclusionStyle: HighwayInclusionStyle,
) {
  if (viewport.bounds == null) return null
  return (
    josmUrl +
    overpassDeUrl +
    compactOverpassQuery(getHighwaysOverpassQuery(viewport.bounds, inclusionStyle))
  )
}

export function buildMapillaryViewportUrl(viewport: MapViewportSnapshot) {
  return mapillaryUrl(viewport.center)
}

export function buildMapillaryRecentPanosViewportUrl(viewport: MapViewportSnapshot) {
  return mapillaryRecentPanosUrl(viewport.center)
}

export function buildOsmchaViewportUrl(viewport: MapViewportSnapshot): string | null {
  if (viewport.bounds == null) return null
  const { west, south, east, north } = viewport.bounds
  const in_bbox = `${west},${south},${east},${north}`
  return osmchaFiltersUrl({ in_bbox })
}

export function wayBboxCoords(
  way: OsmWay,
  nodes: Record<number, OsmNode>,
): TildaFeatureCoord | null {
  let minLon = Infinity
  let minLat = Infinity
  let maxLon = -Infinity
  let maxLat = -Infinity
  let found = false
  for (const nodeId of way.nodes) {
    const node = nodes[nodeId]
    if (!node) continue
    found = true
    minLon = Math.min(minLon, node.lon)
    minLat = Math.min(minLat, node.lat)
    maxLon = Math.max(maxLon, node.lon)
    maxLat = Math.max(maxLat, node.lat)
  }
  if (!found) return null
  return { kind: 'bbox', minLon, minLat, maxLon, maxLat }
}

export function buildTildaInspectorLink(options: {
  mode: StreetSpaceModeId
  viewport: MapViewportSnapshot | null
  selected: OsmFeatureRef | undefined
  selectedWayBbox: TildaFeatureCoord | null
}): string | null {
  const infra = tildaInfraForMode(options.mode)
  if (infra == null || options.viewport == null) return null

  const map = {
    zoom: Math.round(options.viewport.zoom * 10) / 10,
    lat: options.viewport.center.lat,
    lng: options.viewport.center.lng,
  }

  // Bikelanes: feature deeplink when we have an OSM way + bbox.
  if (
    infra === 'bikelanes' &&
    options.selected?.type === 'way' &&
    options.selectedWayBbox != null
  ) {
    return tildaInspectorUrlForInfra(infra, {
      map,
      featureId: `way/${options.selected.id}`,
      coords: options.selectedWayBbox,
    })
  }

  // Parking (and bicycle without selection geometry): viewport-only — Lars ids ≠ OSM way ids.
  return tildaInspectorUrlForInfra(infra, { map })
}

/** Link list for the map external-links dropdown. */
export function buildOsmExternalLinks(options: {
  selected: OsmFeatureRef | undefined
  viewport: MapViewportSnapshot | null
  inclusionStyle: HighwayInclusionStyle
  mode: StreetSpaceModeId
  changesetId?: number | null
  selectedWayBbox?: TildaFeatureCoord | null
}): OsmExternalLink[] {
  const {
    selected,
    viewport,
    inclusionStyle,
    mode,
    changesetId = null,
    selectedWayBbox = null,
  } = options
  const hasSelection = selected != null
  const hasChangeset = changesetId != null && changesetId > 0
  const tildaHref = buildTildaInspectorLink({
    mode,
    viewport,
    selected,
    selectedWayBbox,
  })

  return [
    {
      id: 'view-osm',
      label: m.link_view_osm(),
      href: hasSelection ? buildOsmObjectUrl(selected) : null,
      group: 'view',
      requiresSelection: true,
    },
    {
      id: 'view-mapillary',
      label: m.link_view_mapillary(),
      href: viewport != null ? buildMapillaryViewportUrl(viewport) : null,
      group: 'view',
      requiresSelection: false,
    },
    {
      id: 'view-mapillary-recent-panos',
      label: m.link_view_mapillary_recent_panos(),
      href: viewport != null ? buildMapillaryRecentPanosViewportUrl(viewport) : null,
      group: 'view',
      requiresSelection: false,
    },
    {
      id: 'view-osmcha-viewport',
      label: m.link_view_osmcha_viewport(),
      href: viewport != null ? buildOsmchaViewportUrl(viewport) : null,
      group: 'view',
      requiresSelection: false,
    },
    ...(tildaHref != null
      ? [
          {
            id: 'view-tilda',
            label: m.link_view_tilda(),
            href: tildaHref,
            group: 'view' as const,
            requiresSelection: false,
          },
        ]
      : []),
    {
      id: 'changeset-deep-history',
      label: m.link_changeset_deep_history(),
      href: hasSelection
        ? (osmDeepHistoryUrl({ osmType: selected.type, osmId: selected.id }) ?? null)
        : null,
      group: 'changeset',
      requiresSelection: true,
    },
    {
      id: 'changeset-osm',
      label: m.link_changeset_osm(),
      href: hasChangeset ? osmChangesetUrl(changesetId) : null,
      group: 'changeset',
      requiresSelection: true,
    },
    {
      id: 'changeset-osmcha',
      label: m.link_changeset_osmcha(),
      href: hasChangeset ? osmchaChangesetUrl(changesetId) : null,
      group: 'changeset',
      requiresSelection: true,
    },
    {
      id: 'edit-id-selected',
      label: m.link_edit_id_selection(),
      href: hasSelection ? buildSelectedIdEditorUrl(selected) : null,
      group: 'selection',
      requiresSelection: true,
    },
    {
      id: 'edit-josm-selected',
      label: m.link_edit_josm_selection(),
      href: hasSelection ? buildSelectedJosmUrl(selected) : null,
      group: 'selection',
      requiresSelection: true,
      josm: true,
    },
    {
      id: 'edit-id-viewport',
      label: m.link_open_id_viewport(),
      href: viewport != null ? buildViewportIdEditorUrl(viewport) : null,
      group: 'viewport',
      requiresSelection: false,
    },
    {
      id: 'edit-josm-viewport',
      label: m.link_open_josm_viewport(),
      href: viewport != null ? buildViewportJosmUrl(viewport, inclusionStyle) : null,
      group: 'viewport',
      requiresSelection: false,
      josm: true,
    },
  ]
}

function compactOverpassQuery(query: string) {
  return query.replace(/\s+/g, ' ').trim()
}

function getWayWithRelationsOverpassQuery(wayId: number) {
  return `
    [out:xml];
    (
      way(id:${wayId});
      >;
      way(id:${wayId});
      <;
    );
    out meta;`
}

function getHighwaysOverpassQuery(bounds: MapBounds, inclusionStyle: HighwayInclusionStyle) {
  const bbox = [bounds.south, bounds.west, bounds.north, bounds.east].join(',')
  const selectors = compileOverpassWaySelectors(streetSpaceWayPolicy(inclusionStyle))
  const wayUnion = selectors
    .flatMap((selector) => [`way${selector}(${bbox});`, `>;`, `way${selector}(${bbox});`, `<;`])
    .join('\n      ')
  return `
    [out:xml];
    (
      ${wayUnion}
    );
    out meta;`
}

/** Open a normal external tab, or hit JOSM remote control for `josm` links. */
export async function openExternalLink(href: string, options: { josm: boolean }) {
  if (options.josm) {
    await axios.get(href)
    return
  }
  window.open(href, '_blank', 'noopener,noreferrer')
}
