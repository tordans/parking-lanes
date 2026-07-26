import type { JunctionChoice } from '@osm-editor-kit/osm-way-chain'
import { ChevronLeft, ChevronRight } from 'lucide-react'

type Props = {
  onPrev: () => void
  onNext: () => void
  canPrev: boolean
  canNext: boolean
  pendingJunctions: JunctionChoice[]
  onJunctionPick: (choice: JunctionChoice, wayId: number) => void
}

function segmentLabel(tags: Record<string, string>): string {
  if (tags.name) return tags.name
  if (tags.ref) return tags.ref
  return tags.highway ?? 'road'
}

export function ChainNavigator({
  onPrev,
  onNext,
  canPrev,
  canNext,
  pendingJunctions,
  onJunctionPick,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label="Previous segment"
          disabled={!canPrev}
          onClick={onPrev}
          className="rounded-md border border-zinc-300 p-1.5 text-zinc-700 enabled:hover:bg-zinc-50 disabled:opacity-40"
        >
          <ChevronLeft className="size-4" aria-hidden />
        </button>
        <button
          type="button"
          aria-label="Next segment"
          disabled={!canNext}
          onClick={onNext}
          className="rounded-md border border-zinc-300 p-1.5 text-zinc-700 enabled:hover:bg-zinc-50 disabled:opacity-40"
        >
          <ChevronRight className="size-4" aria-hidden />
        </button>
      </div>

      {pendingJunctions.map((choice) => (
        <div
          key={`${choice.nodeId}-${choice.direction}`}
          className="flex flex-wrap items-center gap-1"
        >
          <span className="text-xs text-zinc-500">
            Junction ({choice.direction === 'forward' ? 'ahead' : 'behind'}):
          </span>
          {choice.candidates.map((candidate) => (
            <button
              key={candidate.id}
              type="button"
              onClick={() => onJunctionPick(choice, candidate.id)}
              className="rounded-md border border-zinc-300 px-2 py-0.5 text-xs text-zinc-700 hover:bg-zinc-50"
            >
              {segmentLabel(candidate.tags)} · {candidate.tags.highway}
            </button>
          ))}
        </div>
      ))}
    </div>
  )
}
