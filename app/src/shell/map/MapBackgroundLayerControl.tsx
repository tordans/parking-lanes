import * as countryCoder from '@rapideditor/country-coder'
import { Check, Layers } from 'lucide-react'
import {
  useEditorLayerIndex,
  type EliCategory,
  type EliLayer,
} from 'maplibre-editor-layer-index/react'
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
import { MAIN_MAP_ID } from './map-ids'
import { useMapLoaded } from './map-store'
import { useMapViewport } from './map-viewport'
import { mapControlButtonClassName } from './mobileMapChrome.const'
import { useBackgroundLayerId, useSetBackgroundLayerId } from './use-background-layer'

const CATEGORY_GROUPS: { key: EliCategory; label: string }[] = [
  { key: 'photo', label: 'Aerial / Satellite' },
  { key: 'map', label: 'Maps' },
  { key: 'osmbasedmap', label: 'OSM-based maps' },
  { key: 'historicmap', label: 'Historic maps' },
  { key: 'historicphoto', label: 'Historic aerial' },
  { key: 'elevation', label: 'Elevation' },
  { key: 'qa', label: 'QA' },
  { key: 'other', label: 'Other' },
]

const DEFAULT_LABEL = 'OpenFreeMap Positron (default)'

/** Layers-icon dropdown to pick ELI imagery for the current viewport, or the default style. */
export function MapBackgroundLayerControl() {
  const mapLoaded = useMapLoaded()
  const { lat, lng } = useMapViewport()
  const backgroundLayerId = useBackgroundLayerId()
  const setBackgroundLayerId = useSetBackgroundLayerId()

  const centerCountry = countryCoder.iso1A2Code([lng, lat])
  const { layers, status } = useEditorLayerIndex({
    mapId: MAIN_MAP_ID,
    filter: {
      excludeOverlays: true,
      ...(centerCountry ? { countryCodes: [centerCountry] } : {}),
    },
  })

  const groups = CATEGORY_GROUPS.map((group) => ({
    ...group,
    items: sortLayers(layers.filter((layer) => (layer.category ?? 'other') === group.key)),
  })).filter((group) => group.items.length > 0)

  return (
    <Dropdown>
      <DropdownButton
        as="button"
        type="button"
        aria-label="Background map"
        className={mapControlButtonClassName}
        disabled={!mapLoaded}
      >
        <Layers className="size-5" aria-hidden />
      </DropdownButton>
      <DropdownMenu
        anchor={{ to: 'top end', gap: 8, padding: 12 }}
        className="z-50 max-h-[min(24rem,calc(100dvh-5.5rem))] w-[min(22rem,calc(100vw-1.25rem))]"
      >
        <DropdownSection>
          <DropdownHeading>Background map</DropdownHeading>
          <BackgroundOption
            selected={backgroundLayerId == null}
            onSelect={() => setBackgroundLayerId(null)}
            label={DEFAULT_LABEL}
          />
        </DropdownSection>

        {status === 'loading' && groups.length === 0 ? (
          <>
            <DropdownDivider />
            <DropdownSection>
              <DropdownHeading>This area</DropdownHeading>
              <DropdownItem disabled>
                <DropdownLabel>Loading layers…</DropdownLabel>
              </DropdownItem>
            </DropdownSection>
          </>
        ) : null}

        {groups.flatMap((group) => [
          <DropdownDivider key={`${group.key}-divider`} />,
          <DropdownSection key={group.key}>
            <DropdownHeading>{group.label}</DropdownHeading>
            {group.items.map((layer) => (
              <BackgroundOption
                key={layer.id}
                selected={backgroundLayerId === layer.id}
                onSelect={() => setBackgroundLayerId(layer.id)}
                label={layer.name}
                best={layer.best}
              />
            ))}
          </DropdownSection>,
        ])}

        {status === 'ready' && groups.length === 0 ? (
          <>
            <DropdownDivider />
            <DropdownSection>
              <DropdownHeading>This area</DropdownHeading>
              <DropdownItem disabled>
                <DropdownLabel>No imagery layers here</DropdownLabel>
              </DropdownItem>
            </DropdownSection>
          </>
        ) : null}
      </DropdownMenu>
    </Dropdown>
  )
}

function BackgroundOption({
  selected,
  onSelect,
  label,
  best = false,
}: {
  selected: boolean
  onSelect: () => void
  label: string
  best?: boolean
}) {
  return (
    <DropdownItem className="items-start" onClick={onSelect}>
      <Check
        data-slot="icon"
        className={selected ? 'mt-0.5 size-4' : 'mt-0.5 size-4 opacity-0'}
        aria-hidden
      />
      <DropdownLabel className="whitespace-normal">
        {label}
        {best ? ' ⭐' : null}
      </DropdownLabel>
    </DropdownItem>
  )
}

function sortLayers(layers: EliLayer[]): EliLayer[] {
  return [...layers].sort((a, b) => {
    if (a.best !== b.best) return a.best ? -1 : 1
    return a.name.localeCompare(b.name)
  })
}
