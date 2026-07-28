import { MISSING_DATA_PINK } from '../map/missing-data-paint'

/** Pink bar — matches the map missing-data centerline (2× black hairline). */
export function MissingDataLegendSwatch() {
  return (
    <span
      className="inline-block h-1 w-4 shrink-0 rounded-sm"
      style={{ backgroundColor: MISSING_DATA_PINK }}
    />
  )
}
