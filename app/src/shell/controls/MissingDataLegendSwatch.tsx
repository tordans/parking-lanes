import { MISSING_DATA_PINK } from '../map/missing-data-paint'

/** Pink bar with black dotted overlay — matches the map missing-data centerline. */
export function MissingDataLegendSwatch() {
  return (
    <span className="relative inline-flex h-0.5 w-4 shrink-0 items-center">
      <span className="absolute inset-x-0 h-0.5" style={{ backgroundColor: MISSING_DATA_PINK }} />
      <span
        className="absolute inset-x-0 h-0.5"
        style={{
          backgroundImage: `repeating-linear-gradient(90deg, #000 0 2px, transparent 2px 5px)`,
        }}
      />
    </span>
  )
}
