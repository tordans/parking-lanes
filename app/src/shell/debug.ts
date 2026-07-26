export const DEBUG_USERS = ['tordans'] as const

export type DebugUser = (typeof DEBUG_USERS)[number]

/** Admin/debug panel accent (matches side-group box pattern). */
export const debugAdminColor = '#db2777'

export function parseDebugSearch(
  value: boolean | 1 | 0 | '1' | 'true' | '0' | 'false' | undefined,
): boolean | undefined {
  if (value === undefined) return undefined
  if (value === true || value === 1 || value === '1' || value === 'true') return true
  if (value === false || value === 0 || value === '0' || value === 'false') return false
  return undefined
}

export function isDebugUser(displayName: string | null | undefined): displayName is DebugUser {
  if (!displayName) return false
  return (DEBUG_USERS as readonly string[]).includes(displayName)
}

export function canShowDebugToggle(displayName: string | null | undefined): boolean {
  // Vite DEV: always. Production: only allowlisted debug users (must be signed in).
  return import.meta.env.DEV === true || isDebugUser(displayName)
}

export function colorForGroupId(groupId: string): string {
  let hash = 0
  for (let i = 0; i < groupId.length; i++) {
    hash = groupId.charCodeAt(i) + ((hash << 5) - hash)
  }
  const hue = Math.abs(hash) % 360
  return `hsl(${hue} 70% 55%)`
}
