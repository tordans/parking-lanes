import type { OsmTags } from '@osm-editor-kit/osm-data'
import type { SettSize } from '@osm-editor-kit/osm-surface-quality'
import {
  catalogue,
  getSmoothnessOptionsForSurface,
  getSurfaceInfo,
} from '@osm-editor-kit/surface-smoothness-data'
import clsx from 'clsx'
import { readChannelValues } from '../domain/surface-edit-layout'
import {
  type FieldKeys,
  settSizeChangePatch,
  smoothnessChangePatch,
  surfaceChangePatch,
  withSettLengthKey,
} from '../domain/surface-tag-patches'
import { SettSizePicker, settLengthForSize } from './SettSizePicker'
import { surfaceDataAssetUrl } from './surface-data-asset-url'
import { SurfaceSuggestions } from './SurfaceSuggestions'

const surfaceList = Object.values(catalogue.surfaces).sort((a, b) =>
  (a.title ?? a.osmValue).localeCompare(b.title ?? b.osmValue),
)

export function SurfaceSmoothnessPicker(props: {
  tags: OsmTags
  parentTags?: OsmTags
  keys: FieldKeys
  readOnly: boolean
  onPatch: (patch: Record<string, string | undefined>) => void
}) {
  const channel = readChannelValues(props.tags, props.keys)
  const surface = channel.surface
  const smoothness = channel.smoothness
  const smoothnessOptions = surface ? getSmoothnessOptionsForSurface(surface) : []
  const surfaceInfo = surface ? getSurfaceInfo(surface) : undefined

  function applySurface(nextSurface: string | undefined, settLength?: number) {
    const patch = surfaceChangePatch(smoothness, nextSurface, props.keys)
    if (nextSurface === 'sett' && settLength != null) {
      const resolved = withSettLengthKey(props.keys)
      patch[resolved.settLengthKey!] = String(settLength)
    }
    props.onPatch(patch)
  }

  function applySmoothness(nextSmoothness: string) {
    const toggled = smoothness === nextSmoothness ? undefined : nextSmoothness
    props.onPatch(smoothnessChangePatch(toggled, props.keys))
  }

  function applySettSize(size: SettSize) {
    props.onPatch(settSizeChangePatch(size, props.keys, settLengthForSize))
  }

  return (
    <div className="flex flex-col gap-3">
      <SurfaceSuggestions
        tags={props.tags}
        parentTags={props.parentTags}
        keys={props.keys}
        readOnly={props.readOnly}
        onApplySurface={applySurface}
        onApplySmoothness={(value) => props.onPatch(smoothnessChangePatch(value, props.keys))}
      />

      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-zinc-700">Surface</span>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {surfaceList.map((entry) => {
            const selected = surface === entry.osmValue
            return (
              <button
                key={entry.osmValue}
                type="button"
                disabled={props.readOnly}
                aria-pressed={selected}
                className={clsx(
                  'flex flex-col items-center gap-1 rounded-md border p-1.5 text-center transition-colors',
                  selected
                    ? 'border-zinc-900 bg-zinc-50 ring-1 ring-zinc-900'
                    : 'border-zinc-200 bg-white hover:border-zinc-400',
                  props.readOnly && 'cursor-not-allowed opacity-60',
                )}
                onClick={() => applySurface(entry.osmValue)}
              >
                {entry.icon ? (
                  <img
                    src={surfaceDataAssetUrl(entry.icon)}
                    alt=""
                    className="h-12 w-full rounded object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-12 w-full items-center justify-center rounded bg-zinc-100 text-[10px] text-zinc-500">
                    {entry.osmValue}
                  </div>
                )}
                <span className="line-clamp-2 text-[10px] leading-tight font-medium text-zinc-800">
                  {entry.title ?? entry.osmValue}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {surface === 'sett' ? (
        <SettSizePicker
          settLength={channel.settLength}
          readOnly={props.readOnly}
          onSelect={applySettSize}
        />
      ) : null}

      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-zinc-700">Smoothness</span>
        {!surface ? (
          <p className="m-0 text-xs text-zinc-500">Pick a surface to see smoothness options.</p>
        ) : !smoothnessOptions.length ? (
          <p className="m-0 text-xs text-zinc-500">
            No smoothness reference photos for {surfaceInfo?.title ?? surface}.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {smoothnessOptions.map((option) => {
              const selected = smoothness === option.smoothness
              return (
                <button
                  key={option.smoothness}
                  type="button"
                  disabled={props.readOnly}
                  aria-pressed={selected}
                  className={clsx(
                    'overflow-hidden rounded-md border text-left transition-colors',
                    selected
                      ? 'border-zinc-900 ring-2 ring-zinc-900'
                      : 'border-zinc-200 hover:border-zinc-400',
                    props.readOnly && 'cursor-not-allowed opacity-60',
                  )}
                  onClick={() => applySmoothness(option.smoothness)}
                >
                  <img
                    src={surfaceDataAssetUrl(option.cell.photo)}
                    alt=""
                    className="aspect-[4/3] w-full object-cover"
                    loading="lazy"
                  />
                  <div className="flex items-center gap-1 px-2 py-1.5">
                    <span className="text-sm">{option.level?.emoji ?? ''}</span>
                    <span className="text-xs font-medium text-zinc-900">
                      {option.level?.title ?? option.smoothness}
                    </span>
                  </div>
                  {option.cell.description ? (
                    <p className="m-0 px-2 pb-2 text-[10px] leading-snug text-zinc-600">
                      {option.cell.description}
                    </p>
                  ) : null}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
