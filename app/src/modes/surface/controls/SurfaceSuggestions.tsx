import type { OsmTags } from '@osm-editor-kit/osm-data'
import {
  deriveSmoothness,
  suggestSmoothnessFromSurface,
  suggestSurfaceFromParent,
} from '@osm-editor-kit/osm-surface-quality'
import clsx from 'clsx'
import { readChannelValues } from '../domain/surface-edit-layout'
import type { FieldKeys } from '../domain/surface-tag-patches'

export function SurfaceSuggestions(props: {
  tags: OsmTags
  parentTags?: OsmTags
  keys: FieldKeys
  readOnly: boolean
  onApplySurface: (surface: string, settLength?: number) => void
  onApplySmoothness: (smoothness: string) => void
}) {
  const channel = readChannelValues(props.tags, props.keys)
  const suggestedSurface = channel.surface
    ? undefined
    : suggestSurfaceFromParent(props.parentTags ?? props.tags)
  const derived = deriveSmoothness({
    ...props.tags,
    surface: channel.surface ?? props.tags[props.keys.surfaceKey],
  })
  const suggestedSmoothness =
    channel.smoothness == null && channel.surface
      ? derived.smoothness_source === 'surface_to_smoothness'
        ? derived.smoothness
        : suggestSmoothnessFromSurface(channel.surface)
      : undefined

  if (!suggestedSurface && !suggestedSmoothness) return null

  return (
    <div className="flex flex-wrap gap-2">
      {suggestedSurface ? (
        <button
          type="button"
          disabled={props.readOnly}
          className={clsx(
            'rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-900',
            props.readOnly ? 'cursor-not-allowed opacity-60' : 'hover:bg-blue-100',
          )}
          onClick={() =>
            props.onApplySurface(suggestedSurface.surface, suggestedSurface.settLength)
          }
        >
          Suggested surface · {suggestedSurface.surface}
        </button>
      ) : null}
      {suggestedSmoothness ? (
        <button
          type="button"
          disabled={props.readOnly}
          className={clsx(
            'rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-900',
            props.readOnly ? 'cursor-not-allowed opacity-60' : 'hover:bg-amber-100',
          )}
          onClick={() => props.onApplySmoothness(suggestedSmoothness)}
        >
          Suggested smoothness · {suggestedSmoothness}
        </button>
      ) : null}
    </div>
  )
}
