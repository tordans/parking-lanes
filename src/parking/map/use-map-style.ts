import { useQuery } from '@tanstack/react-query'
import type { StyleSpecification } from 'maplibre-gl'
import {
  OPENFREEMAP_POSITRON_STYLE_URL,
  patchOpenFreeMapStyle,
} from '../../utils/openfreemap-style'

export function useMapStyle() {
  return useQuery({
    queryKey: ['openfreemap-style', OPENFREEMAP_POSITRON_STYLE_URL],
    queryFn: async (): Promise<StyleSpecification> => {
      const res = await fetch(OPENFREEMAP_POSITRON_STYLE_URL)
      if (!res.ok) throw new Error(`Failed to load map style: ${res.status}`)
      const style = (await res.json()) as StyleSpecification
      return patchOpenFreeMapStyle(style)
    },
    staleTime: Infinity,
    gcTime: Infinity,
  })
}
