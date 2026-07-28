import type { LaneDirection, LaneKind } from '@osm-editor-kit/osm-lanes'
import clsx from 'clsx'
import { motion } from 'motion/react'

/**
 * Glyphs for a cross-section faced along the way's forward direction:
 * forward traffic draws away (↑), backward toward the viewer (↓).
 * Turn left/right stay traveler-relative, so backward flips on screen.
 */
function turnGlyph(turn: string | undefined, direction: LaneDirection): string {
  const facingBackward = direction === 'backward'
  const through = facingBackward ? '↓' : direction === 'both_ways' ? '↕' : '↑'
  const left = facingBackward ? '→' : '←'
  const right = facingBackward ? '←' : '→'

  if (!turn) return through

  const glyphs: string[] = []
  for (const part of turn.toLowerCase().split(';')) {
    if (part.includes('left') || part === 'merge_to_left') glyphs.push(left)
    else if (part.includes('right') || part === 'merge_to_right') glyphs.push(right)
    else if (part.includes('through') || part === 'straight') glyphs.push(through)
    else if (part.includes('reverse') || part.includes('both_ways')) glyphs.push('↕')
    else glyphs.push('·')
  }
  return glyphs.join('') || through
}

const kindStyles: Record<LaneKind, string> = {
  travel: 'bg-zinc-200 text-zinc-800 border-zinc-300',
  bus: 'bg-red-100 text-red-900 border-red-200',
  bicycle: 'bg-teal-100 text-teal-900 border-teal-200',
  both_ways_turn: 'bg-amber-100 text-amber-900 border-amber-200',
}

type Props = {
  kind: LaneKind
  direction: LaneDirection
  turn?: string
  widthMeters?: number
  dimmed?: boolean
  selected?: boolean
  onClick?: () => void
}

export function LaneSlotChip({
  kind,
  direction,
  turn,
  widthMeters,
  dimmed,
  selected,
  onClick,
}: Props) {
  return (
    <motion.button
      type="button"
      layout
      onClick={onClick}
      className={clsx(
        'flex min-h-16 w-full flex-col items-center justify-center gap-0.5 rounded-md border px-1 py-2 text-center transition-shadow',
        kindStyles[kind],
        dimmed && 'opacity-60',
        selected && 'ring-2 ring-blue-500 ring-offset-1',
        onClick && 'cursor-pointer hover:brightness-95',
      )}
    >
      <span className="text-lg leading-none font-semibold">{turnGlyph(turn, direction)}</span>
      {widthMeters != null ? (
        <span className="text-[10px] leading-tight text-zinc-600">{widthMeters} m</span>
      ) : null}
    </motion.button>
  )
}
