import type { JunctionChoice } from '@osm-editor-kit/osm-way-chain'

type Props = {
  pendingJunctions: JunctionChoice[]
  onJunctionPick: (choice: JunctionChoice, wayId: number) => void
}

function segmentLabel(tags: Record<string, string>): string {
  if (tags.name) return tags.name
  if (tags.ref) return tags.ref
  return tags.highway ?? 'road'
}

/** Junction candidate chips when the chain forks — prev/next lives on neighbor cross-sections. */
export function ChainNavigator({ pendingJunctions, onJunctionPick }: Props) {
  if (pendingJunctions.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-2">
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
