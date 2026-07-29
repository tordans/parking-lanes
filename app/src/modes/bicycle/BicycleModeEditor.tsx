import * as m from '@app/paraglide/messages'
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
  useOsmTagDraft,
} from '../../components/tag-editor'
import { AllTagsBlock } from '../../shell/controls/AllTagsBlock'
import { ModePanelIntro } from '../../shell/controls/ModePanelIntro'
import { SideModeSwitcher } from '../parking/controls/editor/SideModeSwitcher'
import { LoginCallout } from '../parking/controls/LoginCallout'
import {
  parkingBothBodyColor,
  parkingSideColor,
  parkingSideLabel,
  type ParkingEditorSide,
} from '../parking/side-colors'
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
  type BicycleEditSide,
} from './domain/bicycle-edit-helpers'
import {
  BICYCLE_COMMON_EDIT_KEYS,
  BICYCLE_FLAT_EDIT_KEYS,
  BICYCLE_LEFT_EDIT_KEYS,
  BICYCLE_RIGHT_EDIT_KEYS,
  type BicycleTagBoxSide,
} from './domain/bicycle-tag-keys'
import { BICYCLE_PAINT_COLORS } from './map/bicycle-colors'
import { useBicycleOsmChangeHandler } from './use-bicycle-mode-handlers'

const CENTERLINE_CYCLEWAY_VALUES = ['separate'] as const
const CENTERLINE_BICYCLE_VALUES = ['use_sidepath', 'optional_sidepath'] as const
const TAG_BOX_SIDES = ['left', 'right'] as const satisfies readonly BicycleTagBoxSide[]

function readCenterlineValue(
  tags: OsmWay['tags'],
  base: 'cycleway' | 'bicycle',
  side: BicycleEditSide,
): string {
  if (side === 'both') return tags[`${base}:both`] ?? ''
  return tags[`${base}:${side}`] ?? ''
}

function writeCenterlineValue(
  base: 'cycleway' | 'bicycle',
  side: BicycleEditSide,
  value: string,
  setTag: (key: string, value: string, options?: { immediate?: boolean }) => void,
) {
  setTag(centerlinePresenceKey(base, side), value, { immediate: true })
}

function CenterlinePresenceFields(props: {
  way: OsmWay
  side: BicycleEditSide
  readOnly: boolean
  setTag: (key: string, value: string, options?: { immediate?: boolean }) => void
  idPrefix: string
}) {
  const { way, side, readOnly, setTag, idPrefix } = props
  return (
    <table className={tagEditorTableClassName}>
      <tbody>
        <TagEditorFieldRow id={`${idPrefix}-cycleway`} tag="cycleway" label="cycleway">
          <TagEditorSelectInput
            tag="cycleway"
            value={readCenterlineValue(way.tags, 'cycleway', side)}
            values={CENTERLINE_CYCLEWAY_VALUES}
            disabled={readOnly}
            onChange={(value) => writeCenterlineValue('cycleway', side, value, setTag)}
          />
        </TagEditorFieldRow>
        <TagEditorFieldRow id={`${idPrefix}-bicycle`} tag="bicycle" label="bicycle">
          <TagEditorSelectInput
            tag="bicycle"
            value={readCenterlineValue(way.tags, 'bicycle', side)}
            values={CENTERLINE_BICYCLE_VALUES}
            disabled={readOnly}
            onChange={(value) => writeCenterlineValue('bicycle', side, value, setTag)}
          />
        </TagEditorFieldRow>
      </tbody>
    </table>
  )
}

function BicycleTagBox(props: {
  side: BicycleTagBoxSide
  title?: string
  color?: string | readonly [string, string]
  bodyColor?: string
  keys: readonly string[]
  shown: boolean
  tags: OsmWay['tags']
  readOnly: boolean
  onTagChange: (key: string, value: string) => void
}) {
  if (!props.shown) return null

  const editorSide = props.side as ParkingEditorSide
  const title = props.title ?? parkingSideLabel(editorSide)
  const color = props.color ?? parkingSideColor(editorSide)

  return (
    <ColoredEditorSection
      aria-label={title}
      title={title}
      color={color}
      bodyColor={props.bodyColor ?? (props.side === 'both' ? parkingBothBodyColor : undefined)}
      className="mb-0"
      contentClassName="py-2"
    >
      <table className={tagEditorTableClassName}>
        <tbody>
          {props.keys.map((key) => (
            <TagEditorFieldRow key={`${props.side}-${key}`} tag={key} label={key}>
              <TagEditorTextInput
                tag={key}
                value={props.tags[key] ?? ''}
                disabled={props.readOnly}
                onChange={(value) => props.onTagChange(key, value)}
              />
            </TagEditorFieldRow>
          ))}
        </tbody>
      </table>
    </ColoredEditorSection>
  )
}

function BicycleModeEditor(props: {
  selectedWay: OsmWay
  selectedOsmRef: OsmFeatureRef
  readOnly: boolean
  onLogin: () => void
  onOsmChange: ReturnType<typeof useBicycleOsmChangeHandler>
}) {
  const { selectedWay, selectedOsmRef, readOnly, onLogin, onOsmChange } = props
  const sidepath = isSidepathRef(selectedOsmRef)
  const [bothSides, setBothSides] = useState(false)
  const [targetCategoryId, setTargetCategoryId] = useState<string | undefined>(undefined)

  const { draftWay, draftTags, setTag, setTags, setWay } = useOsmTagDraft({
    way: selectedWay,
    onCommit: onOsmChange,
  })

  const bikelaneSide = bikelaneSideFromRef(selectedOsmRef)
  const bikelaneResult = findBikelaneResult(draftWay.tags, bikelaneSide)
  const gapResult = findGapResult(draftWay.tags, bikelaneSide)
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
    fromCategory: currentCategory === 'unknown' ? undefined : currentCategory,
    fromIncomplete: incomplete || currentCategory === 'needsClarification',
  })

  const plan =
    resolvedTarget && resolvedTarget !== 'unknown'
      ? planForSide(draftWay.tags, resolvedTarget, bikelaneSide)
      : null

  const sidepathTags = sidepath ? sidepathTagsForRef(draftWay, selectedOsmRef) : undefined
  const editTags = sidepathTags ?? draftWay.tags
  const showCenterlineSection = !sidepath
  const sidepathBoxSide: BicycleTagBoxSide | null = sidepath ? selectedOsmRef.side : null

  function applySuggestions() {
    if (!plan) return
    setTags(applyCategoryPlan(draftWay.tags, plan), { immediate: true })
  }

  function handleFlatTagChange(key: string, value: string) {
    setWay(commitFlatTagEdit(draftWay, selectedOsmRef, key, value || undefined))
  }

  return (
    <div className="flex min-w-[280px] flex-col gap-4 text-zinc-900">
      <ModePanelIntro
        wayId={selectedWay.id}
        highway={selectedWay.tags.highway}
        sidepath={
          sidepath ? { prefix: selectedOsmRef.prefix, side: selectedOsmRef.side } : undefined
        }
        className="flex items-center gap-2"
        leading={
          showCenterlineSection ? (
            <SideModeSwitcher
              bothBlockShown={bothSides}
              readOnly={false}
              onBothBlockShownChange={setBothSides}
            />
          ) : null
        }
      />

      {readOnly ? <LoginCallout onLogin={onLogin} /> : null}

      <ColoredEditorSection
        aria-label={m.bicycle_infrastructure_title()}
        title={m.bicycle_infrastructure_title()}
        color={incomplete ? BICYCLE_PAINT_COLORS.incomplete : BICYCLE_PAINT_COLORS.complete}
        className="mb-0"
        contentClassName="flex flex-col gap-3 py-2"
      >
        <table className={tagEditorTableClassName}>
          <tbody>
            <TagEditorFieldRow tag="current-category" label={m.bicycle_current()}>
              <span className="flex h-5 items-center text-xs leading-tight text-zinc-900">
                {formatCategoryLabel(currentCategory)}
              </span>
            </TagEditorFieldRow>
            <TagEditorFieldRow tag="target-category" label={m.bicycle_target()}>
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
                    <option value="">{m.bicycle_choose_category()}</option>
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
                    aria-label={m.bicycle_clear_target()}
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
            <span className="text-sm font-medium text-zinc-900">{m.bicycle_suggestions()}</span>
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
                  {entry.key === 'category' || entry.key === '_category' ? (
                    entry.reason
                  ) : (
                    <>
                      Not possible with{' '}
                      <code className="text-red-800">
                        {entry.key}={entry.value}
                      </code>
                      : {entry.reason}
                    </>
                  )}
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
                {m.bicycle_apply_suggestions()}
              </button>
            ) : null}
          </div>
        ) : null}
      </ColoredEditorSection>

      {showCenterlineSection ? (
        <ColoredEditorSection
          aria-label={m.bicycle_centerline_presence()}
          title={m.bicycle_centerline_presence()}
          color={BICYCLE_PAINT_COLORS.centerlinePresence}
          className="mb-0"
          contentClassName="flex flex-col gap-3 py-2"
        >
          {bothSides ? (
            <CenterlinePresenceFields
              way={draftWay}
              side="both"
              readOnly={readOnly}
              setTag={setTag}
              idPrefix="centerline-both"
            />
          ) : (
            TAG_BOX_SIDES.map((side) => (
              <div key={side} className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold tracking-wide text-zinc-700 uppercase">
                  {parkingSideLabel(side)}
                </span>
                <CenterlinePresenceFields
                  way={draftWay}
                  side={side}
                  readOnly={readOnly}
                  setTag={setTag}
                  idPrefix={`centerline-${side}`}
                />
              </div>
            ))
          )}
        </ColoredEditorSection>
      ) : null}

      {sidepathBoxSide ? (
        <BicycleTagBox
          side={sidepathBoxSide}
          keys={BICYCLE_FLAT_EDIT_KEYS}
          shown
          tags={editTags}
          readOnly={readOnly}
          onTagChange={handleFlatTagChange}
        />
      ) : bothSides ? (
        <BicycleTagBox
          side="both"
          keys={BICYCLE_FLAT_EDIT_KEYS}
          shown
          tags={editTags}
          readOnly={readOnly}
          onTagChange={handleFlatTagChange}
        />
      ) : (
        <>
          <BicycleTagBox
            side="both"
            title={m.bicycle_tags()}
            color="#52525b"
            bodyColor="#a1a1aa"
            keys={BICYCLE_COMMON_EDIT_KEYS}
            shown
            tags={editTags}
            readOnly={readOnly}
            onTagChange={handleFlatTagChange}
          />
          <BicycleTagBox
            side="left"
            keys={BICYCLE_LEFT_EDIT_KEYS}
            shown
            tags={editTags}
            readOnly={readOnly}
            onTagChange={handleFlatTagChange}
          />
          <BicycleTagBox
            side="right"
            keys={BICYCLE_RIGHT_EDIT_KEYS}
            shown
            tags={editTags}
            readOnly={readOnly}
            onTagChange={handleFlatTagChange}
          />
        </>
      )}

      <AllTagsBlock tags={draftTags} />
    </div>
  )
}

export { BicycleModeEditor }
