import type { OsmWay } from '@osm-editor-kit/osm-data'
import type { OsmFeatureRef } from '@osm-editor-kit/osm-map-url'
import { listTargetCategories } from '@tilda-geo/bicycle-infrastructure'
import clsx from 'clsx'
import { useState } from 'react'
import { SideModeSwitcher } from '../parking/controls/editor/SideModeSwitcher'
import { LoginCallout } from '../parking/controls/LoginCallout'
import {
  applyCategoryPlan,
  bikelaneSideFromRef,
  centerlinePresenceKey,
  commitFlatTagEdit,
  defaultTargetCategory,
  findBikelaneResult,
  findGapResult,
  formatCategoryLabel,
  isSidepathRef,
  planForSide,
  sidepathTagsForRef,
  stageBicycleTagsOnWay,
  type BicycleEditSide,
} from './domain/bicycle-edit-helpers'
import { BICYCLE_FLAT_EDIT_KEYS } from './domain/bicycle-tag-keys'
import { useBicycleOsmChangeHandler } from './use-bicycle-mode-handlers'

const CENTERLINE_CYCLEWAY_VALUES = ['separate'] as const
const CENTERLINE_BICYCLE_VALUES = ['use_sidepath', 'optional_sidepath'] as const

function readCenterlineValue(
  tags: OsmWay['tags'],
  base: 'cycleway' | 'bicycle',
  side: BicycleEditSide,
): string {
  if (side === 'both') return tags[`${base}:both`] ?? ''
  return tags[`${base}:${side}`] ?? ''
}

function writeCenterlineValue(
  way: OsmWay,
  base: 'cycleway' | 'bicycle',
  side: BicycleEditSide,
  value: string,
  onOsmChange: ReturnType<typeof useBicycleOsmChangeHandler>,
) {
  const nextTags = { ...way.tags }
  const key = centerlinePresenceKey(base, side)
  if (value) nextTags[key] = value
  else delete nextTags[key]
  onOsmChange(stageBicycleTagsOnWay(way, nextTags))
}

function BicycleModeEditor(props: {
  selectedWay: OsmWay
  selectedOsmRef: OsmFeatureRef
  readOnly: boolean
  onLogin: () => void
  onOsmChange: ReturnType<typeof useBicycleOsmChangeHandler>
}) {
  const { selectedWay, selectedOsmRef, readOnly, onLogin, onOsmChange } = props
  const [bothSides, setBothSides] = useState(false)
  const [targetCategoryId, setTargetCategoryId] = useState<string | undefined>(undefined)

  const bikelaneSide = bikelaneSideFromRef(selectedOsmRef)
  const bikelaneResult = findBikelaneResult(selectedWay.tags, bikelaneSide)
  const gapResult = findGapResult(selectedWay.tags, bikelaneSide)
  const currentCategory = bikelaneResult?.category ?? 'unknown'
  const incomplete = gapResult?.incomplete ?? false
  const gapUnlocks = gapResult?.missing
    .map((gap) => gap.unlocksCategory)
    .filter((id): id is string => id != null)

  const resolvedTarget =
    targetCategoryId ??
    defaultTargetCategory(currentCategory, incomplete, gapUnlocks ?? []) ??
    undefined

  const targetOptions = listTargetCategories({
    fromCategory: currentCategory,
    fromIncomplete: incomplete || currentCategory === 'needsClarification',
  })

  const plan = resolvedTarget ? planForSide(selectedWay.tags, resolvedTarget, bikelaneSide) : null

  const sidepathTags = isSidepathRef(selectedOsmRef)
    ? sidepathTagsForRef(selectedWay, selectedOsmRef)
    : undefined
  const editTags = sidepathTags ?? selectedWay.tags
  const editSide: BicycleEditSide = bothSides
    ? 'both'
    : isSidepathRef(selectedOsmRef)
      ? selectedOsmRef.side!
      : 'both'
  const showCenterlineSection = !isSidepathRef(selectedOsmRef)

  function applySuggestions() {
    if (!plan) return
    const nextTags = applyCategoryPlan(selectedWay.tags, plan)
    onOsmChange(stageBicycleTagsOnWay(selectedWay, nextTags))
  }

  function handleFlatTagChange(key: string, value: string) {
    onOsmChange(commitFlatTagEdit(selectedWay, selectedOsmRef, key, value || undefined))
  }

  const panelTitle = isSidepathRef(selectedOsmRef)
    ? `Way ${selectedWay.id} · ${selectedOsmRef.prefix}/${selectedOsmRef.side}`
    : `Way ${selectedWay.id}`

  return (
    <div className="flex min-w-[280px] flex-col gap-4 text-zinc-900">
      <div className="text-sm text-zinc-700">
        <a
          href={`https://openstreetmap.org/way/${selectedWay.id}`}
          target="_blank"
          rel="noreferrer"
          className="text-blue-600 hover:underline"
        >
          {panelTitle}
        </a>
        {!isSidepathRef(selectedOsmRef) && selectedWay.tags.highway ? (
          <span className="text-zinc-500"> · {selectedWay.tags.highway}</span>
        ) : null}
      </div>

      {readOnly ? <LoginCallout onLogin={onLogin} /> : null}

      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Current category
        </span>
        <span
          className={clsx(
            'inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-medium',
            incomplete ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900',
          )}
        >
          {formatCategoryLabel(currentCategory)}
        </span>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="bicycle-target-category" className="text-sm font-medium text-zinc-900">
          Target infrastructure
        </label>
        <select
          id="bicycle-target-category"
          value={resolvedTarget ?? ''}
          disabled={readOnly}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm disabled:bg-zinc-50"
          onChange={(event) => {
            const value = event.target.value
            setTargetCategoryId(value || undefined)
          }}
        >
          <option value="">Choose category…</option>
          {targetOptions.map((id) => (
            <option key={id} value={id}>
              {formatCategoryLabel(id)}
            </option>
          ))}
        </select>
        {resolvedTarget ? (
          <button
            type="button"
            disabled={readOnly}
            className="self-start text-xs text-zinc-500 hover:text-zinc-700"
            onClick={() => setTargetCategoryId(undefined)}
          >
            Clear target
          </button>
        ) : null}
      </div>

      {plan && (plan.add.length > 0 || plan.change.length > 0 || plan.conflicts.length > 0) ? (
        <div className="flex flex-col gap-2 rounded-md border border-zinc-200 bg-zinc-50 p-3">
          <span className="text-sm font-medium text-zinc-900">Suggestions</span>
          <ul className="m-0 flex list-none flex-col gap-1 p-0 text-xs text-zinc-700">
            {plan.add.map((entry) => (
              <li key={`add-${entry.key}`}>
                Add{' '}
                <code className="text-zinc-900">
                  {entry.key}={entry.value}
                </code>
              </li>
            ))}
            {plan.change.map((entry) => (
              <li key={`change-${entry.key}`}>
                Change <code className="text-zinc-900">{entry.key}</code> from {entry.from} to{' '}
                {entry.to}
              </li>
            ))}
            {plan.conflicts.map((entry) => (
              <li key={`conflict-${entry.key}`} className="text-red-700">
                Conflict:{' '}
                <code>
                  {entry.key}={entry.value}
                </code>{' '}
                — {entry.reason}
              </li>
            ))}
          </ul>
          {plan.add.length > 0 || plan.change.length > 0 ? (
            <button
              type="button"
              disabled={readOnly}
              className={clsx(
                'rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-900',
                readOnly ? 'cursor-not-allowed opacity-60' : 'hover:bg-blue-100',
              )}
              onClick={applySuggestions}
            >
              Apply suggestions
            </button>
          ) : null}
        </div>
      ) : null}

      {showCenterlineSection ? (
        <div className="flex flex-col gap-3 border-t border-zinc-200 pt-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-zinc-900">Centerline presence</span>
            <SideModeSwitcher
              bothBlockShown={bothSides}
              readOnly={readOnly}
              onBothBlockShownChange={setBothSides}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="flex flex-col gap-1 text-xs text-zinc-600">
              cycleway
              <select
                value={readCenterlineValue(selectedWay.tags, 'cycleway', editSide)}
                disabled={readOnly}
                className="rounded-md border border-zinc-300 px-2 py-1.5 text-sm"
                onChange={(event) =>
                  writeCenterlineValue(
                    selectedWay,
                    'cycleway',
                    editSide,
                    event.target.value,
                    onOsmChange,
                  )
                }
              >
                <option value="">—</option>
                {CENTERLINE_CYCLEWAY_VALUES.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs text-zinc-600">
              bicycle
              <select
                value={readCenterlineValue(selectedWay.tags, 'bicycle', editSide)}
                disabled={readOnly}
                className="rounded-md border border-zinc-300 px-2 py-1.5 text-sm"
                onChange={(event) =>
                  writeCenterlineValue(
                    selectedWay,
                    'bicycle',
                    editSide,
                    event.target.value,
                    onOsmChange,
                  )
                }
              >
                <option value="">—</option>
                {CENTERLINE_BICYCLE_VALUES.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-2 border-t border-zinc-200 pt-3">
        <span className="text-sm font-medium text-zinc-900">Tags</span>
        <table className="w-full border-collapse text-sm">
          <tbody>
            {BICYCLE_FLAT_EDIT_KEYS.map((key) => (
              <tr key={key} className="border-b border-zinc-100 last:border-0">
                <td className="py-1.5 pr-2 align-top text-xs text-zinc-500">{key}</td>
                <td className="py-1.5">
                  <input
                    type="text"
                    value={editTags[key] ?? ''}
                    disabled={readOnly}
                    className="w-full rounded-md border border-zinc-300 px-2 py-1 text-sm disabled:bg-zinc-50"
                    onChange={(event) => handleFlatTagChange(key, event.target.value)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export { BicycleModeEditor }
