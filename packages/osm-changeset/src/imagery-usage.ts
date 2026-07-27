/** Session-scoped imagery sources visible while the user edited (not merely selected). */
export type ImageryUsageSession = {
  record: (value: string) => void
  values: () => string[]
  clear: () => void
  isEmpty: () => boolean
}

export function createImageryUsageSession(): ImageryUsageSession {
  const used = new Set<string>()

  return {
    record(value) {
      const trimmed = value.trim()
      if (trimmed) used.add(trimmed)
    },
    values() {
      return [...used].sort()
    },
    clear() {
      used.clear()
    },
    isEmpty() {
      return used.size === 0
    },
  }
}

/** Join imagery sources for the OSM `imagery_used` changeset tag (iD uses `; `). */
export function formatImageryUsedTag(values: Iterable<string>): string | undefined {
  const entries = [...new Set([...values].map((value) => value.trim()).filter(Boolean))].sort()
  if (entries.length === 0) return undefined
  return entries.join('; ')
}
