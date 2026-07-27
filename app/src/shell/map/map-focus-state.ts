import type { MapFocus } from './search-schema'

export function hasNonDefaultPrimaryFocus(focus: MapFocus | undefined): boolean {
  if (!focus) return false
  return (
    (focus.parking != null && focus.parking !== 'all') ||
    (focus.width != null && focus.width !== 'all') ||
    (focus.bicycle != null && focus.bicycle !== 'all') ||
    (focus.surface != null && focus.surface !== 'all')
  )
}

/** Boundaries on when no `focus` param; off when a non-default primary filter is set unless overridden. */
export function implicitBoundariesEnabled(focus: MapFocus | undefined): boolean {
  if (focus === undefined) return true
  return !hasNonDefaultPrimaryFocus(focus)
}

export function readBoundariesEnabled(focus: MapFocus | undefined): boolean {
  if (focus?.boundaries !== undefined) return focus.boundaries
  return implicitBoundariesEnabled(focus)
}

export function nextBoundariesFocusState(
  current: MapFocus | undefined,
  enabled: boolean,
): MapFocus | undefined {
  const next: NonNullable<MapFocus> = { ...current }

  if (enabled === implicitBoundariesEnabled(current)) {
    delete next.boundaries
  } else {
    next.boundaries = enabled
  }

  if (!hasNonDefaultPrimaryFocus(next) && next.boundaries === undefined) return undefined
  return next
}

export function focusSearchIsEmpty(focus: MapFocus | undefined): boolean {
  if (!focus) return true
  return !hasNonDefaultPrimaryFocus(focus) && focus.boundaries === undefined
}
