import { useParams } from '@tanstack/react-router'
import clsx from 'clsx'
import { Check, ListFilter } from 'lucide-react'
import {
  Dropdown,
  DropdownButton,
  DropdownItem,
  DropdownMenu,
} from '../../components/catalyst/dropdown'
import { Tooltip } from '../../components/Tooltip/Tooltip'
import type { StreetSpaceModeId } from '../../modes/types'
import {
  mapToolbarButtonGroupClassName,
  mapToolbarIconSegmentActiveClassName,
  mapToolbarIconSegmentClassName,
} from '../map/mobileMapChrome.const'
import type { ParkingFocus, WidthFocus } from '../map/search-schema'
import { useMapFocus, useMapFocusSupportsCurrentMode } from '../map/use-map-focus'

type FocusOption = {
  value: ParkingFocus | WidthFocus
  label: string
}

const focusOptionsByMode: Partial<Record<StreetSpaceModeId, FocusOption[]>> = {
  parking: [
    { value: 'all', label: 'All parking lanes' },
    { value: 'noSurface', label: 'Only missing surface tags' },
  ],
  width: [
    { value: 'all', label: 'All infrastructure' },
    { value: 'car', label: 'Car roads' },
    { value: 'bicycle', label: 'Bicycle infrastructure' },
  ],
}

const focusTooltip =
  'Visual focus only — dims other infrastructure on the map. Does not hide or unload data.'

export function FocusFilterButton() {
  const { mode } = useParams({ from: '/$mode' })
  const supportsFocus = useMapFocusSupportsCurrentMode()
  const { focus, setFocus, isActive } = useMapFocus()

  if (!supportsFocus) return null

  const options = focusOptionsByMode[mode] ?? []

  return (
    <div className={mapToolbarButtonGroupClassName}>
      <Dropdown>
        <Tooltip content={focusTooltip} placement="bottom">
          <span className="inline-flex">
            <DropdownButton
              as="button"
              type="button"
              aria-label="Focus filter"
              aria-pressed={isActive}
              className={clsx(
                isActive ? mapToolbarIconSegmentActiveClassName : mapToolbarIconSegmentClassName,
              )}
            >
              <ListFilter className="size-5 shrink-0" aria-hidden />
            </DropdownButton>
          </span>
        </Tooltip>
        <DropdownMenu anchor="bottom start">
          {options.map((option) => (
            <DropdownItem key={option.value} onClick={() => setFocus(option.value)}>
              <span className="col-start-2">{option.label}</span>
              {focus === option.value ? (
                <Check className="col-start-5 size-4 justify-self-end" aria-hidden />
              ) : null}
            </DropdownItem>
          ))}
        </DropdownMenu>
      </Dropdown>
    </div>
  )
}
