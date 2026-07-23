/** Resolve a public asset path for the current Vite base URL (GitHub Pages subpath). */
export function assetUrl(path: string): string {
  const normalized = path.replace(/^\.\//, '')
  const baseUrl = import.meta.env?.BASE_URL ?? '/'
  const base = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`
  return `${base}${normalized}`
}
