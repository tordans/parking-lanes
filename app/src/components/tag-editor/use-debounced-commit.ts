import { useDebouncer } from '@tanstack/react-pacer'
import type { TagCommitOptions } from './tag-draft'

/** Default wait before pushing a free-text edit to the OSM session ([TanStack Pacer](https://tanstack.com/pacer/latest)). */
export const tagEditCommitDebounceMs = 300

/**
 * Debounce session commits while keeping the latest value.
 * Use `{ immediate: true }` for discrete controls (selects, buttons).
 */
export function useDebouncedCommit<T>(
  onCommit: (value: T) => void,
  options?: { wait?: number },
): {
  commit: (value: T, commitOptions?: TagCommitOptions) => void
  flush: () => void
  cancel: () => void
} {
  const wait = options?.wait ?? tagEditCommitDebounceMs
  const debouncer = useDebouncer(
    (value: T) => {
      onCommit(value)
    },
    {
      wait,
      onUnmount: (instance) => instance.flush(),
    },
  )

  return {
    commit(value, commitOptions) {
      if (commitOptions?.immediate) {
        debouncer.cancel()
        onCommit(value)
        return
      }
      debouncer.maybeExecute(value)
    },
    flush: () => debouncer.flush(),
    cancel: () => debouncer.cancel(),
  }
}
