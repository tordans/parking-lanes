const conditionalLabelSuffix = ':conditional'
const conditionalLabelPrefixMaxLength = 6

/** Match parking editor: keep `:conditional`, ellipsis a long middle segment. */
export function compactConditionalTagLabel(label: string): string {
  if (!label.endsWith(conditionalLabelSuffix)) return label

  const prefix = label.slice(0, -conditionalLabelSuffix.length)
  if (prefix.length <= conditionalLabelPrefixMaxLength) return label

  return `${prefix.slice(0, conditionalLabelPrefixMaxLength)}…${conditionalLabelSuffix}`
}

/**
 * Prefer readable OSM keys: keep `cycleway:left` when it fits; if not, shorten the
 * head (`cy…:left`) instead of dropping the namespace to a bare `left`.
 */
export function compactTagKeyLabel(key: string, maxChars: number): string {
  if (maxChars <= 1) return '…'
  if (key.length <= maxChars) return key

  const parts = key.split(':')
  if (parts.length >= 2) {
    const first = parts[0]!
    const rest = parts.slice(1).join(':')
    for (let headLen = Math.min(2, first.length); headLen >= 1; headLen--) {
      const candidate = `${first.slice(0, headLen)}…:${rest}`
      if (candidate.length <= maxChars) return candidate
    }

    const head = `${first.slice(0, Math.min(2, first.length))}…:`
    const restBudget = maxChars - head.length
    if (restBudget >= 2) return `${head}${rest.slice(0, restBudget - 1)}…`
  }

  return `${key.slice(0, maxChars - 1)}…`
}

/**
 * Display label for a tag key. Keeps the OSM key readable (no “left”-only stripping);
 * optionally shortens when the sticky tag column is narrow.
 */
export function formatTableTagKeyLabel(key: string, maxChars?: number): string {
  const label = compactConditionalTagLabel(key)
  if (maxChars == null || label.length <= maxChars) return label
  return compactTagKeyLabel(label, maxChars)
}

/** Approx chars that fit in the sticky tag column (mono text-xs). */
export function approxTagColumnCharBudget(colWidthPx: number): number {
  const paddingPx = 14
  const charPx = 7
  return Math.max(4, Math.floor((colWidthPx - paddingPx) / charPx))
}
