import * as m from '@app/paraglide/messages'
import { X } from 'lucide-react'

/** Small (x) control to clear a tag value (unknown / unset). */
export function TagEditorClearValueButton(props: { disabled?: boolean; onClear: () => void }) {
  return (
    <button
      type="button"
      disabled={props.disabled}
      aria-label={m.editor_clear_value()}
      title={m.editor_clear_value()}
      className="inline-flex size-3.5 shrink-0 items-center justify-center rounded-sm text-zinc-400 hover:bg-zinc-950/5 hover:text-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        props.onClear()
      }}
    >
      <X className="size-2.5" strokeWidth={2.5} aria-hidden />
    </button>
  )
}
