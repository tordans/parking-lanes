/** Port of topics/helper/sanitize_for_logging.lua + sanitize_values.lua */
import { DISALLOWED } from '../types.ts'

/**
 * Returns the value if allowed; `undefined` if explicitly ignored; otherwise the
 * DISALLOWED sentinel (so it can be treated as missing in the decision view).
 */
export function sanitizeForLogging(
  value: string | undefined | null,
  allowed: readonly string[],
  ignored: readonly string[] = [],
): string | undefined {
  if (value == null) return undefined
  if (allowed.includes(value)) return value
  if (ignored.includes(value)) return undefined
  return DISALLOWED
}
