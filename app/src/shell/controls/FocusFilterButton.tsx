import * as m from '@app/paraglide/messages'
import { useParams } from '@tanstack/react-router'
import clsx from 'clsx'
import { Check, Funnel } from 'lucide-react'
import {
  Dropdown,
  DropdownButton,
  DropdownItem,
  DropdownMenu,
} from '../../components/catalyst/dropdown'
import { Tooltip } from '../../components/Tooltip/Tooltip'
import { getFocusOptions } from '../../i18n/focus-labels'
import type { StreetSpaceModeId } from '../../modes/types'
import {
  mapToolbarButtonGroupClassName,
  mapToolbarIconSegmentActiveClassName,
  mapToolbarIconSegmentClassName,
} from '../map/mobileMapChrome.const'
import type { ParkingFocus, BicycleFocus, SurfaceFocus, WidthFocus } from '../map/search-schema'
import { useMapFocus, useMapFocusSupportsCurrentMode } from '../map/use-map-focus'

type FocusOption = {
  value: ParkingFocus | WidthFocus | BicycleFocus | SurfaceFocus
  label: string
}

const focusModes = ['parking', 'width', 'bicycle', 'surface'] as const satisfies StreetSpaceModeId[]

function getFocusOptionsForMode(mode: string): FocusOption[] {
  if (!focusModes.includes(mode as (typeof focusModes)[number])) return []
  return getFocusOptions(mode as (typeof focusModes)[number]) as FocusOption[]
}

export function FocusFilterButton() {
  const { mode } = useParams({ from: '/$mode' })
  const supportsFocus = useMapFocusSupportsCurrentMode()
  const { focus, setFocus, isActive } = useMapFocus()

  if (!supportsFocus) return null

  const options = getFocusOptionsForMode(mode)

  return (
    <div className={mapToolbarButtonGroupClassName}>
      <Dropdown>
        <Tooltip content={m.focus_tooltip()} placement="bottom">
          <span className="inline-flex">
            <DropdownButton
              as="button"
              type="button"
              aria-label={m.focus_filter_aria()}
              aria-pressed={isActive}
              className={clsx(
                isActive ? mapToolbarIconSegmentActiveClassName : mapToolbarIconSegmentClassName,
              )}
            >
              <Funnel className="size-5 shrink-0" aria-hidden />
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
