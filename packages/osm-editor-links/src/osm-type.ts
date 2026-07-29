export type OsmObjectType = 'way' | 'node' | 'relation'
export type OsmShortType = 'w' | 'n' | 'r'

export const longOsmType: Record<string, OsmObjectType> = {
  W: 'way',
  N: 'node',
  R: 'relation',
  w: 'way',
  n: 'node',
  r: 'relation',
  way: 'way',
  node: 'node',
  relation: 'relation',
}

export const shortOsmType: Record<string, OsmShortType> = {
  way: 'w',
  node: 'n',
  relation: 'r',
  w: 'w',
  n: 'n',
  r: 'r',
  W: 'w',
  N: 'n',
  R: 'r',
}

export function toLongOsmType(type: string): OsmObjectType | undefined {
  return longOsmType[type]
}

export function toShortOsmType(type: string): OsmShortType | undefined {
  return shortOsmType[type]
}
