import {
  classifySettSize,
  settLengthForSize,
  type SettSize,
} from '@osm-editor-kit/osm-surface-quality'
import clsx from 'clsx'

const SETT_SIZE_OPTIONS: Array<{ size: SettSize; label: string }> = [
  { size: 'mosaic_sett', label: 'Mosaik' },
  { size: 'small_sett', label: 'Klein' },
  { size: 'large_sett', label: 'Groß' },
]

export function SettSizePicker(props: {
  settLength?: string
  readOnly: boolean
  onSelect: (size: SettSize) => void
}) {
  const currentSize =
    props.settLength != null ? classifySettSize(Number.parseFloat(props.settLength)) : undefined

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-zinc-700">Sett size</span>
      <div className="flex flex-wrap gap-2">
        {SETT_SIZE_OPTIONS.map((option) => (
          <button
            key={option.size}
            type="button"
            disabled={props.readOnly}
            className={clsx(
              'rounded-md border px-2.5 py-1 text-xs font-medium transition-colors',
              currentSize === option.size
                ? 'border-zinc-900 bg-zinc-900 text-white'
                : 'border-zinc-300 bg-white text-zinc-800 hover:border-zinc-400',
              props.readOnly && 'cursor-not-allowed opacity-60',
            )}
            onClick={() => props.onSelect(option.size)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export { settLengthForSize }
