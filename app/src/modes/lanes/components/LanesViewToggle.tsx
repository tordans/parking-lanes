import clsx from 'clsx'

type Props = {
  mode: 'cross-section' | 'table'
  onChange: (mode: 'cross-section' | 'table') => void
}

export function LanesViewToggle({ mode, onChange }: Props) {
  return (
    <div className="inline-flex rounded-md border border-zinc-300 p-0.5 text-xs">
      <button
        type="button"
        onClick={() => onChange('cross-section')}
        className={clsx(
          'rounded px-2 py-1',
          mode === 'cross-section' ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-50',
        )}
      >
        Cross-section
      </button>
      <button
        type="button"
        onClick={() => onChange('table')}
        className={clsx(
          'rounded px-2 py-1',
          mode === 'table' ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-50',
        )}
      >
        Table
      </button>
    </div>
  )
}
