/** Floating map chrome on mobile — safe-area aware, map stays pannable in the gap. */
export const mobileMapHeaderClassName =
  'pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start justify-between gap-2 p-2 pt-[calc(env(safe-area-inset-top)+0.5rem)] pr-[calc(env(safe-area-inset-right)+0.5rem)] pl-[calc(env(safe-area-inset-left)+0.5rem)] sm:hidden [&_a]:pointer-events-auto [&_button]:pointer-events-auto [&_input]:pointer-events-auto'

/** Low, crisp elevation for panel and map floating controls. */
export const floatingChromeShadowClassName =
  'shadow-[0_4px_8px_-2px_rgba(9,9,11,0.18),0_2px_4px_-2px_rgba(9,9,11,0.14)]'

export const floatingChromeElevationClassName = `${floatingChromeShadowClassName} ring-1 ring-zinc-950/5`

/** Segmented map toolbar control (mode tabs, settings/about, etc.). */
export const mapToolbarButtonGroupClassName = `flex overflow-hidden rounded-lg ${floatingChromeElevationClassName}`

export const mapToolbarButtonDividerClassName = 'border-l border-zinc-950/10'

/** Square icon segment inside a toolbar button group. */
const mapToolbarIconSegmentLayoutClassName = 'flex size-10 shrink-0 items-center justify-center'

export const mapToolbarIconSegmentClassName = `${mapToolbarIconSegmentLayoutClassName} cursor-pointer bg-white text-zinc-700 hover:bg-zinc-100 active:bg-zinc-200`

export const mapToolbarIconSegmentActiveClassName = `${mapToolbarIconSegmentLayoutClassName} cursor-default bg-zinc-950 text-white hover:bg-zinc-950 active:bg-zinc-950`

/** Standalone toolbar loading chip (matches map control rounding, not a button). */
export const mapToolbarLoadingSegmentClassName = `flex size-10 shrink-0 items-center justify-center rounded-lg bg-white ${floatingChromeElevationClassName}`

/** Floating map navigation controls (locate, compass). */
export const mapControlsClassName =
  'pointer-events-auto absolute right-2.5 z-20 bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] sm:bottom-[calc(env(safe-area-inset-bottom)+0.625rem)]'

/** Vertical button group for map navigation controls when more than one is visible. */
export const mapControlButtonGroupClassName = `flex flex-col overflow-hidden rounded-lg ${floatingChromeElevationClassName}`

export const mapControlButtonDividerClassName = 'border-t border-zinc-950/10'

/** Segment inside a map navigation button group (matches toolbar segment hover). */
export const mapControlSegmentClassName = mapToolbarIconSegmentClassName

export const mapControlButtonClassName = `flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-white text-zinc-700 ${floatingChromeElevationClassName} hover:bg-zinc-100 active:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-white`
