import { overpassDeUrl } from '@osm-editor-kit/osm-coverage'
import type { LatLngLiteral, MapBounds } from '@osm-editor-kit/osm-data'
import { idEditorUrl, josmUrl, mapillaryUrl, osmProdUrl } from '@osm-editor-kit/osm-editor-links'
import type { OsmFeatureRef } from '@osm-editor-kit/osm-map-url'
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

export function buildViewportJosmUrl(viewport: MapViewportSnapshot) {
  if (viewport.bounds == null) return null
  return josmUrl + overpassDeUrl + compactOverpassQuery(getHighwaysOverpassQuery(viewport.bounds))
}

export function buildMapillaryViewportUrl(viewport: MapViewportSnapshot) {
  return mapillaryUrl(viewport.center)
}

/** Link list for the map external-links dropdown. */
export function buildOsmExternalLinks(options: {
  selected: OsmFeatureRef | undefined
  viewport: MapViewportSnapshot | null
}): OsmExternalLink[] {
  const { selected, viewport } = options
  const hasSelection = selected != null

  return [
    {
      id: 'view-osm',
      label: 'View on OSM',
      href: hasSelection ? buildOsmObjectUrl(selected) : null,
      group: 'view',
      requiresSelection: true,
    },
    {
      id: 'view-mapillary',
      label: 'View in Mapillary',
      href: viewport != null ? buildMapillaryViewportUrl(viewport) : null,
      group: 'view',
      requiresSelection: false,
    },
    {
      id: 'edit-id-selected',
      label: 'Edit selection in iD',
      href: hasSelection ? buildSelectedIdEditorUrl(selected) : null,
      group: 'selection',
      requiresSelection: true,
    },
    {
      id: 'edit-josm-selected',
      label: 'Edit selection in JOSM',
      href: hasSelection ? buildSelectedJosmUrl(selected) : null,
      group: 'selection',
      requiresSelection: true,
      josm: true,
    },
    {
      id: 'edit-id-viewport',
      label: 'Open viewport in iD',
      href: viewport != null ? buildViewportIdEditorUrl(viewport) : null,
      group: 'viewport',
      requiresSelection: false,
    },
    {
      id: 'edit-josm-viewport',
      label: 'Open viewport in JOSM',
      href: viewport != null ? buildViewportJosmUrl(viewport) : null,
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

function getHighwaysOverpassQuery(bounds: MapBounds) {
  const bbox = [bounds.south, bounds.west, bounds.north, bounds.east].join(',')
  const tag =
    'highway~"^motorway|trunk|primary|secondary|tertiary|unclassified|residential|service|living_street"'
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
