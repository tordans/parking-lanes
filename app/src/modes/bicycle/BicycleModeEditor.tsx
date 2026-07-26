import type { OsmWay } from '@osm-editor-kit/osm-data'
import type { OsmFeatureRef } from '@osm-editor-kit/osm-map-url'
import { listTargetCategories } from '@tilda-geo/bicycle-infrastructure'
import clsx from 'clsx'
import { X } from 'lucide-react'
import { useState } from 'react'
import { Select } from '../../components/catalyst/select'
import { ColoredEditorSection } from '../../components/ColoredEditorSection'
import {
  TagEditorFieldRow,
  TagEditorSelectInput,
  TagEditorTextInput,
  tagEditorFieldClassName,
  tagEditorTableClassName,
} from '../../components/tag-editor'
import { ModePanelIntro } from '../../shell/controls/ModePanelIntro'
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
import { BICYCLE_PAINT_COLORS } from './map/bicycle-colors'
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

  const featureSuffix =
    isSidepathRef(selectedOsmRef) && selectedOsmRef.prefix && selectedOsmRef.side
      ? `${selectedOsmRef.prefix}/${selectedOsmRef.side}`
      : undefined

  return (
    <div className="flex min-w-[280px] flex-col gap-4 text-zinc-900">
      <ModePanelIntro
        wayId={selectedWay.id}
        highway={selectedWay.tags.highway}
        featureSuffix={featureSuffix}
        className="flex items-center gap-2"
      />

      {readOnly ? <LoginCallout onLogin={onLogin} /> : null}

      <ColoredEditorSection
        aria-label="Bicycle infrastructure"
        title="Bicycle infrastructure"
        color={incomplete ? BICYCLE_PAINT_COLORS.incomplete : BICYCLE_PAINT_COLORS.complete}
        className="mb-0"
        contentClassName="flex flex-col gap-3 py-2"
      >
        <table className={tagEditorTableClassName}>
          <tbody>
            <TagEditorFieldRow tag="current-category" label="Current">
              <span className="flex h-5 items-center text-xs leading-tight text-zinc-900">
                {formatCategoryLabel(currentCategory)}
              </span>
            </TagEditorFieldRow>
            <TagEditorFieldRow tag="target-category" label="Target">
              <div className="flex min-w-0 flex-1 items-center gap-1">
                <div className="min-w-0 flex-1">
                  <Select
                    id="bicycle-target-category"
                    value={resolvedTarget ?? ''}
                    disabled={readOnly}
                    className={tagEditorFieldClassName}
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
                  </Select>
                </div>
                {resolvedTarget ? (
                  <button
                    type="button"
                    disabled={readOnly}
                    aria-label="Clear target"
                    className="inline-flex size-5 shrink-0 items-center justify-center rounded-sm text-zinc-500 hover:bg-zinc-950/5 hover:text-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={() => setTargetCategoryId(undefined)}
                  >
                    <X className="size-3.5" aria-hidden />
                  </button>
                ) : null}
              </div>
            </TagEditorFieldRow>
          </tbody>
        </table>

        {plan && (plan.add.length > 0 || plan.change.length > 0 || plan.conflicts.length > 0) ? (
          <div className="flex flex-col gap-2 border-t border-zinc-950/10 pt-3">
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
      </ColoredEditorSection>

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
          <table className={tagEditorTableClassName}>
            <tbody>
              <TagEditorFieldRow id="centerline-cycleway" tag="cycleway" label="cycleway">
                <TagEditorSelectInput
                  tag="cycleway"
                  value={readCenterlineValue(selectedWay.tags, 'cycleway', editSide)}
                  values={CENTERLINE_CYCLEWAY_VALUES}
                  disabled={readOnly}
                  onChange={(value) =>
                    writeCenterlineValue(selectedWay, 'cycleway', editSide, value, onOsmChange)
                  }
                />
              </TagEditorFieldRow>
              <TagEditorFieldRow id="centerline-bicycle" tag="bicycle" label="bicycle">
                <TagEditorSelectInput
                  tag="bicycle"
                  value={readCenterlineValue(selectedWay.tags, 'bicycle', editSide)}
                  values={CENTERLINE_BICYCLE_VALUES}
                  disabled={readOnly}
                  onChange={(value) =>
                    writeCenterlineValue(selectedWay, 'bicycle', editSide, value, onOsmChange)
                  }
                />
              </TagEditorFieldRow>
            </tbody>
          </table>
        </div>
      ) : null}

      <div className="flex flex-col gap-2 border-t border-zinc-200 pt-3">
        <span className="text-sm font-medium text-zinc-900">Tags</span>
        <table className={tagEditorTableClassName}>
          <tbody>
            {BICYCLE_FLAT_EDIT_KEYS.map((key) => (
              <TagEditorFieldRow key={key} tag={key} label={key}>
                <TagEditorTextInput
                  tag={key}
                  value={editTags[key] ?? ''}
                  disabled={readOnly}
                  onChange={(value) => handleFlatTagChange(key, value)}
                />
              </TagEditorFieldRow>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export { BicycleModeEditor }
