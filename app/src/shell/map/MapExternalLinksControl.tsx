import * as m from '@app/paraglide/messages'
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
import { useSelectedOsmRef } from './feature-selection'
import { MAIN_MAP_ID } from './map-ids'
import { useMapLoaded } from './map-store'
import { mapControlButtonClassName } from './mobileMapChrome.const'
import {
  buildOsmExternalLinks,
  openExternalLink,
  type MapViewportSnapshot,
  type OsmExternalLink,
} from './osm-external-links'

/** Link-icon dropdown for OSM / Mapillary / iD / JOSM; reads viewport from react-map-gl. */
export function MapExternalLinksControl() {
  const maps = useMap()
  const map = maps[MAIN_MAP_ID]
  const mapLoaded = useMapLoaded()
  const selectedOsmRef = useSelectedOsmRef()

  const viewport = readMapViewportSnapshot(map)
  const links = buildOsmExternalLinks({ selected: selectedOsmRef, viewport })
  const viewLinks = links.filter((link) => link.group === 'view')
  const selectionLinks = links.filter((link) => link.group === 'selection')
  const viewportLinks = links.filter((link) => link.group === 'viewport')
  const selectedLabel =
    selectedOsmRef != null ? `${selectedOsmRef.type}/${selectedOsmRef.id}` : null

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
            View
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
            Edit selection
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
          <DropdownHeading>Edit viewport</DropdownHeading>
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
