import * as m from '@app/paraglide/messages'
import type { PropagateSuggestion } from '../domain/suggestions'

type Props = {
  suggestions: PropagateSuggestion[]
  disabled?: boolean
  onApply: (suggestion: PropagateSuggestion) => void
}

export function PropagateSuggestions({ suggestions, disabled, onApply }: Props) {
  if (suggestions.length === 0) return null

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold tracking-wide text-zinc-600 uppercase">
        {m.table_propagate_heading()}
      </h3>
      <ul className="flex flex-col gap-1.5">
        {suggestions.map((suggestion) => (
          <li
            key={`${suggestion.key}:${suggestion.value}:${suggestion.affectedWayIds.join(',')}`}
            className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-xs"
          >
            <span className="min-w-0 text-zinc-700">
              {m.table_propagate_description({
                key: suggestion.key,
                value: suggestion.value,
                count: suggestion.affectedWayIds.length,
              })}
            </span>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onApply(suggestion)}
              className="shrink-0 rounded-md border border-zinc-300 px-2 py-0.5 font-medium text-zinc-800 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {m.table_propagate_apply()}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
