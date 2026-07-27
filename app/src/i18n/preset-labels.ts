import * as m from '@app/paraglide/messages'

const presetTitleByKey = {
  noStopping: m.editor_preset_no_stopping,
  noParking: m.editor_preset_no_parking,
  noParkingOdd: m.editor_preset_no_parking_odd,
  noParkingEven: m.editor_preset_no_parking_even,
  parking: m.editor_preset_free_parking,
  ticket: m.editor_preset_paid_parking,
} as const satisfies Record<string, () => string>

export function getPresetTitle(key: string): string {
  const label = presetTitleByKey[key as keyof typeof presetTitleByKey]
  return label?.() ?? key
}
