export type StreetImageryConfig = {
  mapillaryToken: string
  panoramaxApiBase: string
}

const DEFAULT_PANORAMAX_API_BASE = 'https://api.panoramax.xyz'

let activeConfig: StreetImageryConfig | null = null

export const createStreetImageryConfig = (input: {
  mapillaryToken: string
  panoramaxApiBase?: string
}): StreetImageryConfig => ({
  mapillaryToken: input.mapillaryToken,
  panoramaxApiBase: (input.panoramaxApiBase ?? DEFAULT_PANORAMAX_API_BASE).replace(/\/$/, ''),
})

export const setStreetImageryConfig = (config: StreetImageryConfig): void => {
  activeConfig = config
}

export const getStreetImageryConfig = (): StreetImageryConfig => {
  if (!activeConfig) {
    throw new Error(
      'Street imagery config is not set. Call setStreetImageryConfig(createStreetImageryConfig(...)) before use.',
    )
  }
  return activeConfig
}
