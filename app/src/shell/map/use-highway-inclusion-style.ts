import type { HighwayInclusionStyle } from '@osm-editor-kit/osm-way-chain'
import { useSearch } from '@tanstack/react-router'
import { readHighwayInclusionStyle } from './search-schema'

export function useHighwayInclusionStyle(): HighwayInclusionStyle {
  const { ways } = useSearch({ from: '/$mode' })
  return readHighwayInclusionStyle(ways)
}
