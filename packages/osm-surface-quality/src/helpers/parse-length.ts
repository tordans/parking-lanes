/** Port of osm2pgsql.split_unit + topics/helper/parse_length.lua */

function splitUnit(str: string | undefined | null): [number, string] | null {
  if (str == null) return null
  const m = str.match(/^(-?[0-9.]+) ?([A-Za-z]*)$/)
  if (!m) return null
  const val = Number(m[1])
  if (Number.isNaN(val)) return null
  const unit = m[2] === '' ? 'm' : m[2]
  return [val, unit]
}

/** Normalize a width/length value to meters; unknown units → undefined. */
export function parseLength(length: string | number | undefined | null): number | undefined {
  if (length == null) return undefined
  const parsed = splitUnit(String(length))
  if (!parsed) return undefined
  const [val, unit] = parsed
  if (unit === 'cm') return val / 100
  if (unit === 'm') return val
  if (unit === 'km') return val * 1000
  return undefined
}
