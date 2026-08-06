import type { OsmFeatureRef } from '@osm-editor-kit/osm-map-url'
import type { EditorPhotoProvider } from './street-imagery-search-params'

export type PhotoTagContext =
  | { kind: 'way'; provider: EditorPhotoProvider }
  | { kind: 'parking-side'; side: 'left' | 'right'; provider: EditorPhotoProvider }
  | {
      kind: 'sidepath'
      prefix: 'cycleway' | 'sidewalk'
      side: 'left' | 'right'
      provider: EditorPhotoProvider
    }

export function photoTagKey(context: PhotoTagContext): string {
  switch (context.kind) {
    case 'way':
      return context.provider
    case 'parking-side':
      return `parking:${context.side}:${context.provider}`
    case 'sidepath':
      return `${context.prefix}:${context.side}:${context.provider}`
  }
}

export function resolvePhotoTagContext(
  provider: EditorPhotoProvider,
  selectedRef: OsmFeatureRef | undefined,
  modeId: string,
): PhotoTagContext {
  if (
    selectedRef?.type === 'way' &&
    selectedRef.prefix &&
    (selectedRef.prefix === 'cycleway' || selectedRef.prefix === 'sidewalk') &&
    selectedRef.side
  ) {
    return {
      kind: 'sidepath',
      prefix: selectedRef.prefix,
      side: selectedRef.side,
      provider,
    }
  }

  if (modeId === 'parking' && selectedRef?.type === 'way') {
    // Parking side tags are keyed per geometric side when editing split sides.
    // v1: default to left when no side is encoded in the selection URL.
    return { kind: 'parking-side', side: 'left', provider }
  }

  return { kind: 'way', provider }
}
