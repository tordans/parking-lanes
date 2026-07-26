/** Split an OSM `*:lanes` pipe-delimited value into per-lane tokens. */
export function splitLanesPipe(value: string | undefined): string[] {
  if (value == null || value === '') return []
  return value.split('|')
}

/** Join per-lane tokens into an OSM `*:lanes` pipe-delimited value. */
export function joinLanesPipe(values: (string | undefined)[]): string {
  return values.map((v) => v ?? '').join('|')
}

export function maxPipeLength(...pipes: (string | undefined)[]): number {
  return pipes.reduce((max, pipe) => Math.max(max, splitLanesPipe(pipe).length), 0)
}

export function padPipe(values: string[], length: number): string[] {
  const result = [...values]
  while (result.length < length) result.push('')
  return result.slice(0, length)
}

export function parsePositiveInt(value: string | undefined): number | undefined {
  if (value == null || value === '') return undefined
  const n = Number.parseInt(value, 10)
  return Number.isFinite(n) && n >= 0 ? n : undefined
}

export function parseWidthMeters(token: string | undefined): number | undefined {
  if (token == null || token === '') return undefined
  const match = /^(\d+(?:\.\d+)?)\s*m?$/i.exec(token.trim())
  if (!match) return undefined
  const n = Number.parseFloat(match[1]!)
  return Number.isFinite(n) ? n : undefined
}
