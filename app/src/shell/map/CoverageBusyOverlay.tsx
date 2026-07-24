export function CoverageBusyOverlay({
  pending,
  fetching,
}: {
  pending: boolean
  fetching: boolean
}) {
  if (!pending && !fetching) return null

  const label = pending && !fetching ? 'Waiting for map…' : 'Loading parking data…'

  return (
    <div className="pointer-events-none absolute top-2.5 right-2.5 z-20">
      <div className="flex items-center gap-2 rounded-lg bg-white/90 px-3 py-2 text-sm text-zinc-800 shadow-xs ring-1 ring-zinc-950/5 backdrop-blur-sm">
        <span
          aria-hidden
          className="size-4 shrink-0 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-700"
        />
        <span>{label}</span>
      </div>
    </div>
  )
}
