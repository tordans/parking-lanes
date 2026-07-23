/** @deprecated Legacy window typing from Leaflet era */
export type OurWindow = Window &
  typeof globalThis & {
    map?: unknown
  }
