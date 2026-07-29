import * as m from '@app/paraglide/messages'
import { useParams } from '@tanstack/react-router'
import { Link2 } from 'lucide-react'
import { useMap } from 'react-map-gl/maplibre'
import {
  Dropdown,
  DropdownButton,
  DropdownDivider,
  DropdownHeading,
  DropdownItem,
  DropdownLabel,
  DropdownMenu,
  DropdownSection,
} from '../../components/catalyst/dropdown'
import type { StreetSpaceModeId } from '../../modes/types'
import { useSelectedOsmRef } from './feature-selection'
import { MAIN_MAP_ID } from './map-ids'
import { useMapLoaded } from './map-store'
import { mapControlButtonClassName } from './mobileMapChrome.const'
import { useOsmCoverageQuery } from './osm-coverage-query'
import {
  buildOsmExternalLinks,
  openExternalLink,
  wayBboxCoords,
  type MapViewportSnapshot,
  type OsmExternalLink,
} from './osm-external-links'
import { useHighwayInclusionStyle } from './use-highway-inclusion-style'

/** Link-icon dropdown for OSM / Mapillary / iD / JOSM / OSMCha / TILDA. */
export function MapExternalLinksControl() {
  const maps = useMap()
  const map = maps[MAIN_MAP_ID]
  const mapLoaded = useMapLoaded()
  const selectedOsmRef = useSelectedOsmRef()
  const inclusionStyle = useHighwayInclusionStyle()
  const { mode: modeSlug } = useParams({ from: '/$mode' })
  const mode = modeSlug as StreetSpaceModeId
  const { data: graph } = useOsmCoverageQuery({ select: (data) => data.graph })

  const selectedElement =
    selectedOsmRef == null || graph == null
      ? null
      : selectedOsmRef.type === 'way'
        ? (graph.ways[selectedOsmRef.id] ?? null)
        : selectedOsmRef.type === 'node'
          ? (graph.nodes[selectedOsmRef.id] ?? null)
          : (graph.relations[selectedOsmRef.id] ?? null)
  const changesetId = selectedElement?.changeset ?? null
  const selectedWayBbox =
    selectedOsmRef?.type === 'way' && selectedElement?.type === 'way' && graph != null
      ? wayBboxCoords(selectedElement, graph.nodes)
      : null

  const viewport = readMapViewportSnapshot(map)
  const links = buildOsmExternalLinks({
    selected: selectedOsmRef,
    viewport,
    inclusionStyle,
    mode,
    changesetId,
    selectedWayBbox,
  })
  const viewLinks = links.filter((link) => link.group === 'view')
  const changesetLinks = links.filter((link) => link.group === 'changeset')
  const selectionLinks = links.filter((link) => link.group === 'selection')
  const viewportLinks = links.filter((link) => link.group === 'viewport')
  const selectedLabel =
    selectedOsmRef != null ? `${selectedOsmRef.type}/${selectedOsmRef.id}` : null
  const changesetLabel = changesetId != null && changesetId > 0 ? String(changesetId) : null

  return (
    <Dropdown>
      <DropdownButton
        as="button"
        type="button"
        aria-label={m.map_external_links_aria()}
        className={mapControlButtonClassName}
        disabled={!mapLoaded || viewport == null}
      >
        <Link2 className="size-5" aria-hidden />
      </DropdownButton>
      <DropdownMenu anchor={{ to: 'top end', gap: 8, padding: 12 }} className="z-50 min-w-56">
        <DropdownSection>
          <DropdownHeading>
            {m.map_external_links_group_view()}
            {selectedLabel != null ? (
              <span className="font-mono font-normal">{selectedLabel}</span>
            ) : null}
          </DropdownHeading>
          {viewLinks.map((link) => (
            <ExternalLinkItem key={link.id} link={link} />
          ))}
        </DropdownSection>
        <DropdownDivider />
        <DropdownSection>
          <DropdownHeading>
            {m.map_external_links_group_changeset()}
            {changesetLabel != null ? (
              <span className="font-mono font-normal">{changesetLabel}</span>
            ) : null}
          </DropdownHeading>
          {changesetLinks.map((link) => (
            <ExternalLinkItem key={link.id} link={link} />
          ))}
        </DropdownSection>
        <DropdownDivider />
        <DropdownSection>
          <DropdownHeading>
            {m.map_external_links_group_selection()}
            {selectedLabel != null ? (
              <span className="font-mono font-normal">{selectedLabel}</span>
            ) : null}
          </DropdownHeading>
          {selectionLinks.map((link) => (
            <ExternalLinkItem key={link.id} link={link} />
          ))}
        </DropdownSection>
        <DropdownDivider />
        <DropdownSection>
          <DropdownHeading>{m.map_external_links_group_viewport()}</DropdownHeading>
          {viewportLinks.map((link) => (
            <ExternalLinkItem key={link.id} link={link} />
          ))}
        </DropdownSection>
      </DropdownMenu>
    </Dropdown>
  )
}

function ExternalLinkItem({ link }: { link: OsmExternalLink }) {
  const href = link.href

  return (
    <DropdownItem
      disabled={href == null}
      onClick={() => {
        if (href == null) return
        void openExternalLink(href, { josm: link.josm === true })
      }}
    >
      <DropdownLabel>{link.label}</DropdownLabel>
    </DropdownItem>
  )
}

function readMapViewportSnapshot(
  map: ReturnType<typeof useMap>[typeof MAIN_MAP_ID] | undefined,
): MapViewportSnapshot | null {
  if (map == null) return null

  const center = map.getCenter()
  const bounds = map.getBounds()
  if (center == null || bounds == null) return null

  return {
    center: { lat: center.lat, lng: center.lng },
    zoom: map.getZoom(),
    bounds: {
      south: bounds.getSouth(),
      west: bounds.getWest(),
      north: bounds.getNorth(),
      east: bounds.getEast(),
    },
  }
}
