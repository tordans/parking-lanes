/** Floating map chrome on mobile — safe-area aware, map stays pannable in the gap. */
export const mobileMapHeaderClassName =
  'pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start justify-between gap-2 p-2 pt-[calc(env(safe-area-inset-top)+0.5rem)] pr-[calc(env(safe-area-inset-right)+0.5rem)] pl-[calc(env(safe-area-inset-left)+0.5rem)] lg:hidden [&_a]:pointer-events-auto [&_button]:pointer-events-auto [&_input]:pointer-events-auto'

/** Bottom-left legend slot — sits above compact MapLibre attribution. */
export const mapLegendClassName =
  'pointer-events-auto absolute bottom-[calc(env(safe-area-inset-bottom)+2rem)] left-2.5 z-10 lg:bottom-8'

/** Segmented map toolbar control (mode tabs, settings/about, etc.). */
export const mapToolbarButtonGroupClassName =
  'flex overflow-hidden rounded-lg ring-1 ring-zinc-950/10'

export const mapToolbarButtonDividerClassName = 'border-l border-zinc-950/10'

/** Square icon segment inside a toolbar button group. */
export const mapToolbarIconSegmentClassName =
  'flex size-10 shrink-0 cursor-pointer items-center justify-center bg-white text-zinc-700 hover:bg-zinc-950/5'

export const mapToolbarIconSegmentActiveClassName = 'bg-zinc-950 text-white hover:bg-zinc-800'

/** Standalone toolbar loading chip (matches map control rounding, not a button). */
export const mapToolbarLoadingSegmentClassName =
  'flex size-10 shrink-0 items-center justify-center rounded-lg bg-white shadow-xs ring-1 ring-zinc-950/10'

/** Floating map navigation controls (locate, compass). */
export const mapControlsClassName =
  'pointer-events-auto absolute right-2.5 z-20 flex flex-col gap-2 bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] lg:top-1/2 lg:bottom-auto lg:-translate-y-1/2'

export const mapControlButtonClassName =
  'flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-white text-zinc-700 shadow-xs ring-1 ring-zinc-950/10 hover:bg-zinc-950/5 disabled:cursor-not-allowed disabled:opacity-60'
