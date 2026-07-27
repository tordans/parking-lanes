import * as m from '@app/paraglide/messages'
import { overpassDeUrl } from '@osm-editor-kit/osm-coverage'
import type { LatLngLiteral, MapBounds } from '@osm-editor-kit/osm-data'
import {
  idEditorUrl,
  josmUrl,
  mapillaryRecentPanosUrl,
  mapillaryUrl,
  osmProdUrl,
} from '@osm-editor-kit/osm-editor-links'
import type { OsmFeatureRef } from '@osm-editor-kit/osm-map-url'
import type { HighwayInclusionStyle } from '@osm-editor-kit/osm-way-chain'
import { overpassRoadLikeSelector } from '@osm-editor-kit/osm-way-chain'
import axios from 'axios'

export type MapViewportSnapshot = {
  center: LatLngLiteral
  zoom: number
  bounds: MapBounds | null
}

export type OsmExternalLink = {
  id: string
  label: string
  href: string | null
  group: 'view' | 'selection' | 'viewport'
  /** Selection-scoped links stay visible but disabled when nothing is selected. */
  requiresSelection: boolean
  /** JOSM remote-control links need a special click handler. */
  josm?: boolean
}

export function buildOsmObjectUrl(ref: OsmFeatureRef) {
  return `${osmProdUrl}/${ref.type}/${ref.id}`
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

/** Link list for the map external-links dropdown. */
export function buildOsmExternalLinks(options: {
  selected: OsmFeatureRef | undefined
  viewport: MapViewportSnapshot | null
  inclusionStyle: HighwayInclusionStyle
}): OsmExternalLink[] {
  const { selected, viewport, inclusionStyle } = options
  const hasSelection = selected != null

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
  const tag = overpassRoadLikeSelector(inclusionStyle)
  return `
    [out:xml];
    (
      way[${tag}](${bbox});
      >;
      way[${tag}](${bbox});
      <;
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
