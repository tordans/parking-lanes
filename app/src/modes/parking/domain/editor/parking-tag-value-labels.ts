import * as m from '@app/paraglide/messages'

const parkingTagValueLabelByValue = {
  lane: m.parking_value_lane,
  street_side: m.parking_value_street_side,
  on_kerb: m.parking_value_on_kerb,
  half_on_kerb: m.parking_value_half_on_kerb,
  shoulder: m.parking_value_shoulder,
  no: m.parking_value_no,
  separate: m.parking_value_separate,
  yes: m.parking_value_yes,
  on_street: m.parking_value_on_street,
  painted_area_only: m.parking_value_painted_area_only,
  parallel: m.parking_value_parallel,
  diagonal: m.parking_value_diagonal,
  perpendicular: m.parking_value_perpendicular,
  marked: m.parking_value_marked,
  no_parking: m.parking_value_no_parking,
  no_standing: m.parking_value_no_standing,
  no_stopping: m.parking_value_no_stopping,
  loading_only: m.parking_value_loading_only,
  charging_only: m.parking_value_charging_only,
  free: m.parking_value_free,
  ticket: m.parking_value_ticket,
  disc: m.parking_value_disc,
  residents: m.parking_value_residents,
  customers: m.parking_value_customers,
  private: m.parking_value_private,
  disabled: m.parking_value_disabled,
} as const satisfies Record<string, () => string>

export function getParkingTagValueLabel(value: string): string | undefined {
  const label = parkingTagValueLabelByValue[value as keyof typeof parkingTagValueLabelByValue]
  return label?.()
}
