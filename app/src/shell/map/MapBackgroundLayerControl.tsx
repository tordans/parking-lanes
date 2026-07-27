import * as m from '@app/paraglide/messages'
import * as countryCoder from '@rapideditor/country-coder'
import { Check, Layers } from 'lucide-react'
import type { EliCategory } from 'maplibre-editor-layer-index/react'
import { useEditorLayerIndex, type EliLayer } from 'maplibre-editor-layer-index/react'
import {
  Dropdown,
  DropdownButton,
  DropdownDescription,
  DropdownDivider,
  DropdownHeading,
  DropdownItem,
  DropdownLabel,
  DropdownMenu,
  DropdownSection,
} from '../../components/catalyst/dropdown'
import { HotkeyKbd } from '../../components/HotkeyKbd'
import { getBackgroundCategoryLabel } from '../../i18n/map-labels'
import { usePreviousBackgroundLayerId } from './background-history-store'
import { MAIN_MAP_ID } from './map-ids'
import { useMapLoaded } from './map-store'
import { useMapViewport } from './map-viewport'
import { mapControlButtonClassName } from './mobileMapChrome.const'
import {
  useBackgroundHotkeys,
  useBackgroundLayerId,
  useSetBackgroundLayerId,
} from './use-background-layer'

const CATEGORY_GROUPS: { key: EliCategory }[] = [
  { key: 'photo' },
  { key: 'map' },
  { key: 'osmbasedmap' },
  { key: 'historicmap' },
  { key: 'historicphoto' },
  { key: 'elevation' },
  { key: 'qa' },
  { key: 'other' },
]

/** Layers-icon dropdown to pick ELI imagery for the current viewport, or the default style. */
export function MapBackgroundLayerControl() {
  const mapLoaded = useMapLoaded()
  const { lat, lng } = useMapViewport()
  const backgroundLayerId = useBackgroundLayerId()
  const setBackgroundLayerId = useSetBackgroundLayerId()
  const previousBackgroundLayerId = usePreviousBackgroundLayerId()
  useBackgroundHotkeys()

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
    label: getBackgroundCategoryLabel(group.key),
    items: sortLayers(layers.filter((layer) => (layer.category ?? 'other') === group.key)),
  })).filter((group) => group.items.length > 0)

  const showToggleHint = previousBackgroundLayerId !== undefined

  return (
    <Dropdown>
      <DropdownButton
        as="button"
        type="button"
        aria-label={m.map_background_aria()}
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
          <DropdownHeading>{m.map_background_heading()}</DropdownHeading>
          <BackgroundOption
            selected={backgroundLayerId == null}
            onSelect={() => setBackgroundLayerId(null)}
            label={m.map_background_default()}
            showToggleHint={showToggleHint && backgroundLayerId == null}
          />
        </DropdownSection>

        {status === 'loading' && groups.length === 0 ? (
          <>
            <DropdownDivider />
            <DropdownSection>
              <DropdownHeading>{m.map_background_this_area()}</DropdownHeading>
              <DropdownItem disabled>
                <DropdownLabel>{m.map_background_loading()}</DropdownLabel>
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
                showToggleHint={showToggleHint && backgroundLayerId === layer.id}
              />
            ))}
          </DropdownSection>,
        ])}

        {status === 'ready' && groups.length === 0 ? (
          <>
            <DropdownDivider />
            <DropdownSection>
              <DropdownHeading>{m.map_background_this_area()}</DropdownHeading>
              <DropdownItem disabled>
                <DropdownLabel>{m.map_background_none()}</DropdownLabel>
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
  showToggleHint = false,
}: {
  selected: boolean
  onSelect: () => void
  label: string
  best?: boolean
  showToggleHint?: boolean
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
      {showToggleHint ? (
        <DropdownDescription className="inline-flex items-center gap-1.5">
          <HotkeyKbd hotkey="Mod+B" />
          <span>{m.map_background_toggle_hint()}</span>
        </DropdownDescription>
      ) : null}
    </DropdownItem>
  )
}

function sortLayers(layers: EliLayer[]): EliLayer[] {
  return [...layers].sort((a, b) => {
    if (a.best !== b.best) return a.best ? -1 : 1
    return a.name.localeCompare(b.name)
  })
}
