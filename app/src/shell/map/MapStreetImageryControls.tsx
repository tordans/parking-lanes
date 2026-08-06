import * as m from '@app/paraglide/messages'
import clsx from 'clsx'
import { SlidersHorizontal } from 'lucide-react'
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
import { Field, Label } from '../../components/catalyst/fieldset'
import { Input } from '../../components/catalyst/input'
import { mapControlButtonClassName } from './mobileMapChrome.const'
import {
  DEFAULT_PHOTO_TYPES,
  EDITOR_PHOTO_PROVIDERS,
  type EditorPhotoProvider,
  type EditorPhotoType,
} from './street-imagery-search-params'
import { useModeSearchNavigation } from './use-mode-search-navigation'

const PROVIDER_LABEL: Record<EditorPhotoProvider, () => string> = {
  mapillary: () => m.street_imagery_provider_mapillary(),
  panoramax: () => m.street_imagery_provider_panoramax(),
}

export function MapStreetImageryControls() {
  const { search, updateSearch } = useModeSearchNavigation()
  const enabled = new Set(search.photos ?? [])
  const photoTypeSet = new Set(search.photoTypes ?? [...DEFAULT_PHOTO_TYPES])

  const toggleProvider = (provider: EditorPhotoProvider) => {
    const next = new Set(search.photos ?? [])
    if (next.has(provider)) next.delete(provider)
    else next.add(provider)

    const providers = EDITOR_PHOTO_PROVIDERS.filter((id) => next.has(id))
    updateSearch(
      {
        photos: providers.length > 0 ? providers : undefined,
        photo: providers.length === 0 ? undefined : search.photo,
      },
      { replace: true },
    )
  }

  const togglePhotoType = (type: EditorPhotoType, checked: boolean) => {
    const next = new Set(search.photoTypes ?? [...DEFAULT_PHOTO_TYPES])
    if (checked) next.add(type)
    else next.delete(type)

    const resolved = DEFAULT_PHOTO_TYPES.filter((value) => next.has(value))
    updateSearch(
      {
        photoTypes: resolved.length > 0 ? resolved : [...DEFAULT_PHOTO_TYPES],
      },
      { replace: true },
    )
  }

  const updateDate = (part: 'from' | 'to', value: string) => {
    const next = { ...search.photoDate }
    if (value) next[part] = value
    else delete next[part]
    updateSearch(
      {
        photoDate: next.from || next.to ? next : undefined,
      },
      { replace: true },
    )
  }

  const anyEnabled = (search.photos?.length ?? 0) > 0

  return (
    <>
      <div className={mapControlButtonClassName + ' flex flex-col overflow-hidden p-0'}>
        {EDITOR_PHOTO_PROVIDERS.map((provider, index) => (
          <button
            key={provider}
            type="button"
            aria-label={PROVIDER_LABEL[provider]()}
            aria-pressed={enabled.has(provider)}
            className={clsx(
              'flex size-10 shrink-0 items-center justify-center border-zinc-950/10',
              index > 0 && 'border-t',
              enabled.has(provider)
                ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                : 'bg-white text-zinc-700 hover:bg-zinc-100',
            )}
            onClick={() => toggleProvider(provider)}
            title={PROVIDER_LABEL[provider]()}
          >
            <span className="text-[10px] font-bold uppercase">{provider.slice(0, 2)}</span>
          </button>
        ))}
      </div>

      <Dropdown>
        <DropdownButton
          as="button"
          type="button"
          aria-label={m.street_imagery_filter_aria()}
          className={mapControlButtonClassName}
          disabled={!anyEnabled}
        >
          <SlidersHorizontal className="size-5" aria-hidden />
        </DropdownButton>
        <DropdownMenu anchor={{ to: 'top end', gap: 8, padding: 12 }} className="z-50 w-64">
          <DropdownSection>
            <DropdownHeading>{m.street_imagery_filter_heading()}</DropdownHeading>
            <DropdownItem onClick={() => togglePhotoType('flat', !photoTypeSet.has('flat'))}>
              <DropdownLabel>{m.street_imagery_filter_flat()}</DropdownLabel>
              <span className="text-xs text-zinc-500">{photoTypeSet.has('flat') ? '✓' : ''}</span>
            </DropdownItem>
            <DropdownItem onClick={() => togglePhotoType('pano', !photoTypeSet.has('pano'))}>
              <DropdownLabel>{m.street_imagery_filter_pano()}</DropdownLabel>
              <span className="text-xs text-zinc-500">{photoTypeSet.has('pano') ? '✓' : ''}</span>
            </DropdownItem>
          </DropdownSection>
          <DropdownDivider />
          <DropdownSection>
            <DropdownHeading>{m.street_imagery_filter_date()}</DropdownHeading>
            <div className="flex flex-col gap-2 px-3 py-2">
              <Field>
                <Label>{m.street_imagery_filter_date_from()}</Label>
                <Input
                  type="date"
                  value={search.photoDate?.from ?? ''}
                  onChange={(event) => updateDate('from', event.target.value)}
                />
              </Field>
              <Field>
                <Label>{m.street_imagery_filter_date_to()}</Label>
                <Input
                  type="date"
                  value={search.photoDate?.to ?? ''}
                  onChange={(event) => updateDate('to', event.target.value)}
                />
              </Field>
            </div>
          </DropdownSection>
        </DropdownMenu>
      </Dropdown>
    </>
  )
}
