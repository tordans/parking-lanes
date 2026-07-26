import type { LaneKind } from '@osm-editor-kit/osm-lanes'
import clsx from 'clsx'
import { motion } from 'motion/react'

function turnGlyph(turn: string | undefined): string {
  if (!turn) return '↑'
  const parts = turn.toLowerCase().split(';')
  const glyphs: string[] = []
  for (const part of parts) {
    if (part.includes('left') || part === 'merge_to_left') glyphs.push('←')
    else if (part.includes('right') || part === 'merge_to_right') glyphs.push('→')
    else if (part.includes('through') || part === 'straight') glyphs.push('↑')
    else if (part.includes('reverse') || part.includes('both_ways')) glyphs.push('↕')
    else glyphs.push('·')
  }
  return glyphs.join('') || '↑'
}

const kindStyles: Record<LaneKind, string> = {
  travel: 'bg-zinc-200 text-zinc-800 border-zinc-300',
  bus: 'bg-red-100 text-red-900 border-red-200',
  bicycle: 'bg-teal-100 text-teal-900 border-teal-200',
  both_ways_turn: 'bg-amber-100 text-amber-900 border-amber-200',
}

type Props = {
  kind: LaneKind
  turn?: string
  widthMeters?: number
  dimmed?: boolean
  selected?: boolean
  onClick?: () => void
}

export function LaneSlotChip({ kind, turn, widthMeters, dimmed, selected, onClick }: Props) {
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
      <span className="text-lg leading-none font-semibold">{turnGlyph(turn)}</span>
      {widthMeters != null ? (
        <span className="text-[10px] leading-tight text-zinc-600">{widthMeters} m</span>
      ) : null}
    </motion.button>
  )
}
