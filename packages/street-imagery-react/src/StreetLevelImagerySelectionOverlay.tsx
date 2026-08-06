import {
  emptyLineCollection,
  emptyPointCollection,
  photosToFeatureCollection,
  sequencesToFeatureCollection,
} from '@osm-editor-kit/street-imagery'
import type { Bbox, NormalizedPhoto, NormalizedSequence } from '@osm-editor-kit/street-imagery'
import { Layer, Source } from 'react-map-gl/maplibre'

const HIGHLIGHT_SOURCE_ID = 'selection-highlight'
const HIGHLIGHT_LAYER_ID = 'selection-highlight-layer'
const SEQUENCE_HIGHLIGHT_SOURCE_ID = 'sequence-highlight'
const SEQUENCE_HIGHLIGHT_LAYER_ID = 'sequence-highlight-layer'

export type StreetLevelImagerySelectionOverlayProps = {
  selectedPhoto?: NormalizedPhoto | null
  selectedSequence?: NormalizedSequence | null
}

export const StreetLevelImagerySelectionOverlay = ({
  selectedPhoto,
  selectedSequence,
}: StreetLevelImagerySelectionOverlayProps) => {
  const highlightCollection = selectedPhoto
    ? photosToFeatureCollection([selectedPhoto])
    : emptyPointCollection()

  const sequenceHighlightCollection = selectedSequence
    ? sequencesToFeatureCollection([selectedSequence])
    : emptyLineCollection()

  if (!selectedPhoto && sequenceHighlightCollection.features.length === 0) {
    return null
  }

  return (
    <>
      {selectedPhoto ? (
        <>
          <Source id={HIGHLIGHT_SOURCE_ID} type="geojson" data={highlightCollection} />
          <Layer
            id={HIGHLIGHT_LAYER_ID}
            type="circle"
            source={HIGHLIGHT_SOURCE_ID}
            paint={{
              'circle-radius': 10,
              'circle-color': '#ffffff',
              'circle-stroke-width': 3,
              'circle-stroke-color': '#0f172a',
            }}
          />
        </>
      ) : null}

      {sequenceHighlightCollection.features.length > 0 ? (
        <>
          <Source
            id={SEQUENCE_HIGHLIGHT_SOURCE_ID}
            type="geojson"
            data={sequenceHighlightCollection}
          />
          <Layer
            id={SEQUENCE_HIGHLIGHT_LAYER_ID}
            type="line"
            source={SEQUENCE_HIGHLIGHT_SOURCE_ID}
            paint={{
              'line-color': '#0f172a',
              'line-width': 4,
              'line-opacity': 0.75,
            }}
          />
        </>
      ) : null}
    </>
  )
}

/** Resolve sequence geometry for highlight when only photo + fetched sequences are available. */
export const resolveSelectedSequence = (
  selectedPhoto: NormalizedPhoto | null | undefined,
  sequences: NormalizedSequence[],
  sequenceId: string | null | undefined,
): NormalizedSequence | null => {
  if (!selectedPhoto || !sequenceId) {
    return null
  }

  return (
    sequences.find(
      (sequence) =>
        sequence.providerId === selectedPhoto.providerId && sequence.sequenceId === sequenceId,
    ) ?? null
  )
}

export type SequenceHighlightBbox = Bbox | null
