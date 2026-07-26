import { getParkingTagValueLabel } from './parking-tag-value-labels'

export function formatParkingTagValueLabel(value: string): string {
  if (!value) return ''
  return getParkingTagValueLabel(value) ?? value
}
