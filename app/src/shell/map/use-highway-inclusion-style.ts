import { useSearch } from '@tanstack/react-router'
import { readHighwayInclusionStyle } from './search-schema'
import type { HighwayInclusionStyle } from './street-space-way-policy'

export function useHighwayInclusionStyle(): HighwayInclusionStyle {
  const { ways } = useSearch({ from: '/$mode' })
  return readHighwayInclusionStyle(ways)
}
