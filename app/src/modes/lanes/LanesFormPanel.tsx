import * as m from '@app/paraglide/messages'
import * as Headless from '@headlessui/react'
import type { OsmWay } from '@osm-editor-kit/osm-data'
import {
  isOneway,
  parseWayLanes,
  reconcileWidths,
  type WayLaneModel,
} from '@osm-editor-kit/osm-lanes'
import { nestSideTags, type SidepathPrefix } from '@osm-editor-kit/osm-sidepath-tags'
import { Link } from '@tanstack/react-router'
import clsx from 'clsx'
import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react'
import { useCallback, useEffect, useRef, useState, type ReactElement } from 'react'
import { MetersInput } from '../../components/MetersInput'
import { YesNoOrTextField } from '../../components/tag-editor'
import { AuthState, useAuthState } from '../../shell/app-store'
import { ChainNavigator } from '../../shell/controls/ChainNavigator'
import {
  MapFeatureLoadEmptyState,
  MapFeaturePromptEmptyState,
} from '../../shell/controls/MapFeatureEmptyState'
import { ModePanelIntro } from '../../shell/controls/ModePanelIntro'
import {
  useFeatureSelectionActions,
  useSelectedOsmRef,
} from '../../shell/map/feature-selection-store'
import { useMapViewport } from '../../shell/map/map-viewport'
import { LoginCallout } from '../parking/controls/LoginCallout'
import { useOsmAuth } from '../parking/map/use-osm-auth'
import { applyOnewayLaneCount } from './domain/lanes-edits'
import {
  applyLaneFieldUpdate,
  buildMatrixColumns,
  edgePatchForRow,
  getMatrixCell,
  MATRIX_ROWS,
  type MatrixColumn,
  type MatrixRowId,
} from './domain/lanes-matrix-model'
import { resolveImpliedOneway, resolveImpliedOnewayBicycle } from './domain/oneway-defaults'
import {
  CYCLEWAY_PRESENCE_VALUES,
  resolveSidepathPresence,
  SIDEWALK_PRESENCE_VALUES,
  SIDEWALK_SIDE_VALUES,
  type SidepathPresence,
} from './domain/sidepath-presence'
import { useLanesChainBuilder } from './domain/use-lanes-chain'
import { useRoadSpaceChain } from './domain/use-road-space-chain'
import { viewMinZoom } from './map/constants'
import { useLanesChain, useLanesMapActions, useLanesPendingJunctions } from './map/lanes-map-store'
import { useIsLanesOsmFetching, useLanesOsmQuery } from './map/lanes-osm-query'
import { useLanesModeHandlers, useLanesOsmChangeHandler } from './use-lanes-mode-handlers'

/** Select with empty option; preserves unexpected existing values instead of dropping them. */
function EnumSelect(props: {
  label: string
  value: string
  options: readonly string[]
  disabled?: boolean
  onChange: (value: string) => void
}): ReactElement {
  const options =
    !props.value || props.options.includes(props.value)
      ? ['', ...props.options]
      : ['', props.value, ...props.options]

  return (
    <label className="flex flex-col gap-0.5 text-xs">
      <span className="text-zinc-600">{props.label}</span>
      <select
        disabled={props.disabled}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        className="rounded border border-zinc-300 px-1.5 py-1 font-mono text-sm disabled:bg-zinc-50"
      >
        {options.map((o) => (
          <option key={o || '__empty'} value={o}>
            {o === '' ? '—' : o}
          </option>
        ))}
      </select>
    </label>
  )
}

function PresenceFields(props: {
  prefix: SidepathPrefix
  presence: SidepathPresence
  readOnly: boolean
  options: readonly string[]
  sideOptions: readonly string[]
  onPatchTags: (patch: Record<string, string | undefined>) => void
}): ReactElement {
  const { prefix, presence, readOnly, options, sideOptions, onPatchTags } = props

  if (presence.schema === 'sided') {
    return (
      <div className="col-span-2 grid grid-cols-2 gap-2">
        <EnumSelect
          label={`${prefix}:${m.lanes_presence_left()}`}
          value={presence.left ?? ''}
          options={sideOptions}
          disabled={readOnly}
          onChange={(value) =>
            onPatchTags({ [`${prefix}:left`]: value === '' ? undefined : value })
          }
        />
        <EnumSelect
          label={`${prefix}:${m.lanes_presence_right()}`}
          value={presence.right ?? ''}
          options={sideOptions}
          disabled={readOnly}
          onChange={(value) =>
            onPatchTags({ [`${prefix}:right`]: value === '' ? undefined : value })
          }
        />
      </div>
    )
  }

  return (
    <EnumSelect
      label={presence.writeKey || prefix}
      value={presence.value}
      options={options}
      disabled={readOnly}
      onChange={(value) => {
        const key = presence.writeKey || prefix
        onPatchTags({ [key]: value === '' ? undefined : value })
      }}
    />
  )
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable
}

function rowLabel(id: MatrixRowId): string {
  switch (id) {
    case 'turn':
      return m.lanes_matrix_row_turn()
    case 'width':
      return m.lanes_matrix_row_width()
    case 'surface':
      return m.lanes_matrix_row_surface()
    case 'smoothness':
      return m.lanes_matrix_row_smoothness()
    case 'change':
      return m.lanes_matrix_row_change()
    case 'vehicle':
      return m.lanes_matrix_row_vehicle()
    case 'bicycle':
      return m.lanes_matrix_row_bicycle()
    case 'bus':
      return m.lanes_matrix_row_bus()
  }
}

type CarriagewayWidthKey = 'width' | 'est_width'

function initialCarriagewayWidthKey(tags: Record<string, string>): CarriagewayWidthKey {
  const hasWidth = tags.width != null && tags.width !== ''
  const hasEst = tags.est_width != null && tags.est_width !== ''
  if (!hasWidth && hasEst) return 'est_width'
  return 'width'
}

function MatrixCellFlyout(props: {
  column: MatrixColumn
  row: MatrixRowId
  display: string
  provenance: string
  editable: boolean
  readOnlyHint?: string
  inputPlaceholder?: string
  onHighlight: (slotId: string | null) => void
  onCommit: (value: string) => void
  focusWins: boolean
  setFocusWins: (wins: boolean) => void
}) {
  const {
    column,
    row,
    display,
    provenance,
    editable,
    readOnlyHint,
    inputPlaceholder,
    onHighlight,
    onCommit,
    focusWins,
    setFocusWins,
  } = props
  const isPlaceholderDisplay = provenance !== 'tagged' || display === '—' || display === '·'
  const initial = isPlaceholderDisplay ? '' : display
  const [draft, setDraft] = useState(initial)
  const buttonRef = useRef<HTMLButtonElement>(null)

  function closeFlyout(close: () => void) {
    setFocusWins(false)
    onHighlight(null)
    close()
    // Headless restores focus after unmount; reinforce so Cancel/Apply always return.
    requestAnimationFrame(() => buttonRef.current?.focus())
  }

  return (
    <Headless.Popover className="relative">
      {(popover: { open: boolean; close: () => void }) => (
        <>
          <Headless.PopoverButton
            ref={buttonRef}
            disabled={!editable && !readOnlyHint}
            onMouseEnter={() => {
              if (focusWins) return
              onHighlight(column.slotId)
            }}
            onMouseLeave={() => {
              if (focusWins || popover.open) return
              onHighlight(null)
            }}
            onFocus={() => {
              setFocusWins(true)
              onHighlight(column.slotId)
            }}
            onBlur={() => {
              if (popover.open) return
              setFocusWins(false)
              onHighlight(null)
            }}
            className={clsx(
              'w-full min-w-[3.5rem] rounded px-1.5 py-1 text-left text-xs outline-none',
              provenance === 'tagged'
                ? 'bg-white text-zinc-900'
                : 'bg-zinc-50 text-zinc-400 italic',
              editable
                ? 'cursor-pointer hover:ring-1 hover:ring-blue-400 focus-visible:ring-2 focus-visible:ring-blue-500'
                : 'cursor-default',
            )}
          >
            {display}
          </Headless.PopoverButton>
          <Headless.PopoverPanel
            anchor="bottom start"
            focus
            className="z-50 w-52 rounded-lg border border-zinc-200 bg-white p-2 shadow-lg"
          >
            {editable ? (
              <form
                className="flex flex-col gap-2"
                onSubmit={(event) => {
                  event.preventDefault()
                  onCommit(draft)
                  closeFlyout(popover.close)
                }}
              >
                <label className="flex flex-col gap-1 text-xs">
                  <span className="font-medium text-zinc-700">{rowLabel(row)}</span>
                  {row === 'width' ? (
                    <MetersInput
                      value={draft}
                      placeholder={inputPlaceholder}
                      onChange={setDraft}
                      onFocus={() => {
                        setDraft(initial)
                        setFocusWins(true)
                        onHighlight(column.slotId)
                      }}
                    />
                  ) : (
                    <input
                      type="text"
                      value={draft}
                      placeholder={inputPlaceholder}
                      onChange={(event) => setDraft(event.target.value)}
                      onFocus={() => {
                        setDraft(initial)
                        setFocusWins(true)
                        onHighlight(column.slotId)
                      }}
                      className="rounded-md border border-zinc-300 px-2 py-1.5 text-sm"
                    />
                  )}
                </label>
                <div className="flex justify-end gap-1">
                  <button
                    type="button"
                    className="rounded px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-100"
                    onClick={() => closeFlyout(popover.close)}
                  >
                    {m.shell_close()}
                  </button>
                  <button
                    type="submit"
                    className="rounded bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700"
                  >
                    {m.lanes_matrix_apply()}
                  </button>
                </div>
              </form>
            ) : (
              <p className="text-xs text-zinc-600">{readOnlyHint}</p>
            )}
          </Headless.PopoverPanel>
        </>
      )}
    </Headless.Popover>
  )
}

function WayLevelFields(props: {
  way: OsmWay
  model: WayLaneModel
  readOnly: boolean
  onPatchTags: (patch: Record<string, string | undefined>) => void
  onCommitModel: (model: WayLaneModel) => void
}) {
  const { way, model, readOnly } = props
  const tags = way.tags
  const effectiveOnewayTags = {
    ...tags,
    oneway: model.oneway ?? tags.oneway ?? '',
  }
  const oneway = isOneway(effectiveOnewayTags)
  const impliedOneway = resolveImpliedOneway(tags)
  const impliedOnewayBicycle = resolveImpliedOnewayBicycle(effectiveOnewayTags)

  const [widthKey, setWidthKey] = useState<CarriagewayWidthKey>(() =>
    initialCarriagewayWidthKey(tags),
  )
  const [syncedWayId, setSyncedWayId] = useState(way.id)
  if (syncedWayId !== way.id) {
    setSyncedWayId(way.id)
    setWidthKey(initialCarriagewayWidthKey(way.tags))
  }

  function setModelField<K extends keyof WayLaneModel>(key: K, value: WayLaneModel[K]) {
    if (readOnly) return
    props.onCommitModel({ ...model, [key]: value })
  }

  // serializeWayLanes (oneway) writes `lanes` from lanesForward ?? lanesTotal.
  function setOnewayLaneCount(value: number | undefined) {
    if (readOnly) return
    props.onCommitModel(applyOnewayLaneCount(model, value))
  }

  function setTag(key: string, value: string) {
    if (readOnly) return
    props.onPatchTags({ [key]: value.trim() === '' ? undefined : value.trim() })
  }

  function toggleCarriagewayWidthKey() {
    if (readOnly) return
    const next: CarriagewayWidthKey = widthKey === 'width' ? 'est_width' : 'width'
    const value = tags[widthKey]
    props.onPatchTags({
      [widthKey]: undefined,
      [next]: value != null && value !== '' ? value : undefined,
    })
    setWidthKey(next)
  }

  const sidewalkPresence = resolveSidepathPresence(tags, 'sidewalk')
  const cyclewayPresence = resolveSidepathPresence(tags, 'cycleway')

  const sharedSidepath =
    tags.segregated != null ||
    (tags.cycleway === 'track' && tags.sidewalk != null) ||
    tags['cycleway:left'] === 'track' ||
    tags['cycleway:right'] === 'track' ||
    tags['cycleway:both'] === 'track'

  return (
    <section className="flex flex-col gap-2 rounded-md border border-zinc-200 bg-white p-2">
      <h3 className="text-xs font-semibold text-zinc-800">{m.lanes_way_level_title()}</h3>
      <div className="grid grid-cols-2 gap-2">
        <YesNoOrTextField
          label="oneway"
          name="oneway"
          value={model.oneway ?? tags.oneway ?? ''}
          impliedValue={impliedOneway}
          disabled={readOnly}
          onChange={(v) => setModelField('oneway', v === '' ? undefined : v)}
        />
        <YesNoOrTextField
          label="oneway:bicycle"
          name="oneway:bicycle"
          value={tags['oneway:bicycle'] ?? ''}
          impliedValue={impliedOnewayBicycle}
          disabled={readOnly}
          onChange={(v) => setTag('oneway:bicycle', v)}
        />
      </div>
      <div className="grid grid-cols-4 gap-2">
        <label className="flex min-w-0 flex-col gap-0.5 text-xs">
          <span className="truncate text-zinc-600" title="lanes">
            lanes
          </span>
          <input
            type="number"
            min={0}
            disabled={readOnly}
            value={model.lanesTotal ?? ''}
            onChange={(e) => {
              const n = Number.parseInt(e.target.value, 10)
              const value = Number.isFinite(n) ? n : undefined
              if (oneway) setOnewayLaneCount(value)
              else setModelField('lanesTotal', value)
            }}
            className="min-w-0 rounded border border-zinc-300 px-1.5 py-1 text-sm disabled:bg-zinc-50"
          />
        </label>
        <label className="flex min-w-0 flex-col gap-0.5 text-xs">
          <span className="truncate text-zinc-600" title="lanes:forward">
            la…:forward
          </span>
          <input
            type="number"
            min={0}
            disabled={readOnly}
            value={model.lanesForward ?? ''}
            onChange={(e) => {
              const n = Number.parseInt(e.target.value, 10)
              const value = Number.isFinite(n) ? n : undefined
              if (oneway) setOnewayLaneCount(value)
              else setModelField('lanesForward', value)
            }}
            className="min-w-0 rounded border border-zinc-300 px-1.5 py-1 text-sm disabled:bg-zinc-50"
          />
        </label>
        <label className="flex min-w-0 flex-col gap-0.5 text-xs">
          <span className="truncate text-zinc-600" title="lanes:backward">
            la…:backward
          </span>
          <input
            type="number"
            min={0}
            disabled={readOnly || oneway}
            title={oneway ? m.lanes_oneway_disabled_hint() : undefined}
            value={model.lanesBackward ?? ''}
            onChange={(e) => {
              const n = Number.parseInt(e.target.value, 10)
              setModelField('lanesBackward', Number.isFinite(n) ? n : undefined)
            }}
            className="min-w-0 rounded border border-zinc-300 px-1.5 py-1 text-sm disabled:bg-zinc-50"
          />
        </label>
        <label className="flex min-w-0 flex-col gap-0.5 text-xs">
          <span className="truncate text-zinc-600" title="lanes:both_ways">
            la…:both_ways
          </span>
          <input
            type="number"
            min={0}
            disabled={readOnly || oneway}
            title={oneway ? m.lanes_oneway_disabled_hint() : undefined}
            value={model.lanesBothWays ?? ''}
            onChange={(e) => {
              const n = Number.parseInt(e.target.value, 10)
              setModelField('lanesBothWays', Number.isFinite(n) ? n : undefined)
            }}
            className="min-w-0 rounded border border-zinc-300 px-1.5 py-1 text-sm disabled:bg-zinc-50"
          />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-0.5 text-xs">
          <span className="flex items-center justify-between gap-1 text-zinc-600">
            <span className="flex items-center gap-1">
              <span className="font-mono">{widthKey}</span>
              <button
                type="button"
                disabled={readOnly}
                onClick={toggleCarriagewayWidthKey}
                aria-label={m.lanes_width_key_toggle_aria()}
                title={m.lanes_width_key_toggle_aria()}
                className="rounded border border-zinc-300 px-1 py-0 font-mono text-[10px] leading-4 text-zinc-600 hover:bg-zinc-50 disabled:cursor-default disabled:opacity-40"
              >
                {widthKey === 'width' ? 'est' : 'width'}
              </button>
            </span>
            <Link
              to="/audit-width"
              hash="road_kerb"
              className="shrink-0 font-normal text-blue-700 hover:underline"
            >
              {m.lanes_width_help_kerb()}
            </Link>
          </span>
          <MetersInput
            disabled={readOnly}
            value={tags[widthKey] ?? ''}
            onChange={(value) => setTag(widthKey, value)}
          />
        </label>
        <label className="flex flex-col gap-0.5 text-xs">
          <span className="text-zinc-600">placement</span>
          <input
            disabled={readOnly}
            value={model.placement ?? ''}
            onChange={(e) => setModelField('placement', e.target.value || undefined)}
            className="rounded border border-zinc-300 px-1.5 py-1 text-sm disabled:bg-zinc-50"
          />
        </label>
        <YesNoOrTextField
          label="lane_markings"
          name="lane_markings"
          value={model.laneMarkings ?? tags.lane_markings ?? ''}
          disabled={readOnly}
          onChange={(v) => setModelField('laneMarkings', v === 'yes' || v === 'no' ? v : undefined)}
        />
        <YesNoOrTextField
          label="dual_carriageway"
          name="dual_carriageway"
          value={tags.dual_carriageway ?? ''}
          disabled={readOnly}
          onChange={(v) => setTag('dual_carriageway', v)}
        />
        <div className="col-span-2 grid grid-cols-2 gap-2">
          <PresenceFields
            prefix="sidewalk"
            presence={sidewalkPresence}
            readOnly={readOnly}
            options={SIDEWALK_PRESENCE_VALUES}
            sideOptions={SIDEWALK_SIDE_VALUES}
            onPatchTags={props.onPatchTags}
          />
          <PresenceFields
            prefix="cycleway"
            presence={cyclewayPresence}
            readOnly={readOnly}
            options={CYCLEWAY_PRESENCE_VALUES}
            sideOptions={CYCLEWAY_PRESENCE_VALUES}
            onPatchTags={props.onPatchTags}
          />
        </div>
        {sharedSidepath ? (
          <YesNoOrTextField
            label="segregated"
            name="segregated"
            value={tags.segregated ?? ''}
            disabled={readOnly}
            onChange={(v) => setTag('segregated', v)}
          />
        ) : null}
      </div>
      {sidewalkPresence.isUnknown ? (
        <p className="text-[11px] text-amber-700">{m.lanes_sidewalk_unknown()}</p>
      ) : null}
    </section>
  )
}

function WidthSumStrip({ tags }: { tags: Record<string, string> }) {
  const recon = reconcileWidths(tags)
  const laneWidthsTagged = recon.slotSumM != null
  const showReconcileChips = laneWidthsTagged && recon.widthM != null
  const partsSum =
    recon.slotSumM != null ? recon.slotSumM + recon.parkingM + recon.bufferM : undefined

  return (
    <section className="flex flex-col gap-1.5 rounded-md border border-zinc-200 bg-zinc-50/80 p-2">
      <h3 className="text-xs font-semibold text-zinc-800">{m.lanes_width_sum_title()}</h3>
      <div className="flex flex-wrap gap-1.5 text-[11px]">
        <span className="rounded bg-white px-1.5 py-0.5 ring-1 ring-zinc-200">
          {recon.widthSource ?? 'width'}:{' '}
          <strong>{recon.widthM != null ? `${recon.widthM} m` : '—'}</strong>
        </span>
        {laneWidthsTagged ? (
          <span className="rounded bg-white px-1.5 py-0.5 ring-1 ring-zinc-200">
            Σ width:lanes: {recon.slotSumM!.toFixed(2)} m
          </span>
        ) : (
          <span className="rounded bg-white px-1.5 py-0.5 text-zinc-500 ring-1 ring-zinc-200">
            {m.lanes_width_no_lane_widths()}
          </span>
        )}
        {recon.parkingM > 0 ? (
          <span
            className="rounded bg-amber-50 px-1.5 py-0.5 text-amber-900 ring-1 ring-amber-200"
            title={m.lanes_width_parking_readonly()}
          >
            parking: {recon.parkingM.toFixed(2)} m ({m.lanes_width_readonly_chip()})
          </span>
        ) : null}
        {recon.bufferM > 0 ? (
          <span className="rounded bg-white px-1.5 py-0.5 ring-1 ring-zinc-200">
            buffer: {recon.bufferM.toFixed(2)} m
          </span>
        ) : null}
        {showReconcileChips ? (
          <span className="rounded bg-white px-1.5 py-0.5 ring-1 ring-zinc-200">
            paint≈ {recon.paintEstimateM.toFixed(2)} m
          </span>
        ) : null}
        {showReconcileChips && recon.residualM != null && partsSum != null ? (
          <span className="rounded bg-white px-1.5 py-0.5 ring-1 ring-zinc-200">
            residual: {recon.residualM.toFixed(2)} m (parts {partsSum.toFixed(2)})
          </span>
        ) : null}
      </div>
      {recon.warnings.length > 0 ? (
        <ul className="list-inside list-disc text-[11px] text-amber-800">
          {recon.warnings.map((w) => (
            <li key={w.code}>{w.message}</li>
          ))}
        </ul>
      ) : null}
      <p className="text-[11px] text-zinc-500">
        <Link to="/audit-width" hash="road_width_lanes" className="text-blue-700 hover:underline">
          {m.lanes_width_help_lanes()}
        </Link>
        {' · '}
        <Link
          to="/audit-width"
          hash="road_width_vs_lanes"
          className="text-blue-700 hover:underline"
        >
          {m.lanes_width_help_vs_lanes()}
        </Link>
        {' · '}
        <Link to="/audit-width" hash="cycleway_buffer" className="text-blue-700 hover:underline">
          {m.lanes_width_help_buffer()}
        </Link>
      </p>
    </section>
  )
}

export function LanesFormPanel() {
  const selectedOsmRef = useSelectedOsmRef()
  const { selectFeature } = useFeatureSelectionActions()
  const centerWayId = selectedOsmRef?.type === 'way' ? selectedOsmRef.id : undefined
  const chain = useLanesChain()
  const pendingJunctions = useLanesPendingJunctions()
  const { setHighlightedSlot } = useLanesMapActions()
  const { scene, topNeighbor, bottomNeighbor } = useRoadSpaceChain()
  const { extendAtJunction } = useLanesChainBuilder(centerWayId)
  const authState = useAuthState()
  const readOnly = authState !== AuthState.success
  const { login } = useOsmAuth()
  const panelRef = useRef<HTMLDivElement>(null)
  const [focusWins, setFocusWins] = useState(false)
  const mapViewport = useMapViewport()
  const { data: graph } = useLanesOsmQuery({ select: (data) => data.graph })
  const isFetching = useIsLanesOsmFetching()
  const { commitSlotUpdate, commitLaneModel } = useLanesModeHandlers()
  const handleOsmChange = useLanesOsmChangeHandler()

  const centerWay = centerWayId != null ? (graph?.ways[centerWayId] ?? null) : null

  const walkToWay = useCallback(
    (wayId: number) => {
      selectFeature({ type: 'way', id: wayId })
    },
    [selectFeature],
  )

  useEffect(
    function keyboardWalkAlongStreet() {
      const panel = panelRef.current
      if (!panel) return

      function onKeyDown(event: KeyboardEvent) {
        if (isTypingTarget(event.target)) return

        if (event.key === 'ArrowUp') {
          event.preventDefault()
          if (topNeighbor) walkToWay(topNeighbor.id)
        } else if (event.key === 'ArrowDown') {
          event.preventDefault()
          if (bottomNeighbor) walkToWay(bottomNeighbor.id)
        } else if (event.key === 'Escape') {
          setHighlightedSlot(null)
        }
      }

      panel.addEventListener('keydown', onKeyDown)
      return () => panel.removeEventListener('keydown', onKeyDown)
    },
    [bottomNeighbor, setHighlightedSlot, topNeighbor, walkToWay],
  )

  if (!centerWayId) {
    return <MapFeaturePromptEmptyState message={m.empty_click_lanes()} />
  }

  if (!centerWay) {
    return (
      <MapFeatureLoadEmptyState
        zoom={mapViewport.zoom}
        minZoom={viewMinZoom}
        isFetching={isFetching}
        featureLabel={`way/${centerWayId}`}
      />
    )
  }

  const model = parseWayLanes(centerWay.tags)
  const columns = buildMatrixColumns(scene, centerWay.tags)
  const warnings = model.warnings
  const hasErrors = warnings.some((w) => w.severity === 'error')
  const way = centerWay

  function patchTags(patch: Record<string, string | undefined>) {
    const nextTags = { ...way.tags }
    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined) delete nextTags[key]
      else nextTags[key] = value
    }
    handleOsmChange({ ...way, tags: nextTags })
  }

  function commitCell(column: MatrixColumn, row: MatrixRowId, value: string) {
    if (readOnly) return
    if (column.edge) {
      const edgePatch = edgePatchForRow(row, value)
      if (!edgePatch) return
      handleOsmChange({
        ...way,
        tags: nestSideTags(way.tags, column.edge.prefix, column.edge.side, edgePatch),
      })
      return
    }
    commitSlotUpdate(way, (slots) => applyLaneFieldUpdate(slots, column, row, value))
  }

  return (
    <div
      ref={panelRef}
      tabIndex={0}
      className="flex h-full flex-col gap-3 overflow-y-auto p-3 outline-none"
    >
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                disabled={!topNeighbor}
                aria-label={m.chain_prev_segment()}
                title={m.chain_prev_segment()}
                onClick={() => topNeighbor && walkToWay(topNeighbor.id)}
                className="rounded border border-zinc-300 p-1 text-zinc-700 hover:bg-zinc-50 disabled:opacity-40"
              >
                <ChevronUp className="size-4" aria-hidden />
              </button>
              <button
                type="button"
                disabled={!bottomNeighbor}
                aria-label={m.chain_next_segment()}
                title={m.chain_next_segment()}
                onClick={() => bottomNeighbor && walkToWay(bottomNeighbor.id)}
                className="rounded border border-zinc-300 p-1 text-zinc-700 hover:bg-zinc-50 disabled:opacity-40"
              >
                <ChevronDown className="size-4" aria-hidden />
              </button>
            </div>
            <ModePanelIntro
              wayId={centerWay.id}
              highway={centerWay.tags.highway}
              identityStart
              className="flex min-w-0 items-center gap-2"
            />
          </div>
          <ChainNavigator
            pendingJunctions={pendingJunctions}
            onJunctionPick={(choice, wayId) => {
              if (!chain) return
              void extendAtJunction(choice, wayId, chain).then(() => walkToWay(wayId))
            }}
          />
        </div>

        {readOnly ? <LoginCallout onLogin={() => void login()} /> : null}
      </div>

      {warnings.length > 0 ? (
        <div
          className={
            hasErrors
              ? 'flex items-start gap-2 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-900'
              : 'flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900'
          }
          role="alert"
        >
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          <span>{warnings.map((w) => w.message).join(' · ')}</span>
        </div>
      ) : null}

      <WayLevelFields
        way={way}
        model={model}
        readOnly={readOnly}
        onPatchTags={patchTags}
        onCommitModel={(next) => commitLaneModel(way, next)}
      />

      <WidthSumStrip tags={way.tags} />

      <section className="relative min-w-0 rounded-md border border-zinc-200 bg-white">
        <div className="overflow-x-auto overscroll-x-contain [scrollbar-gutter:stable]">
          <table className="min-w-max border-collapse text-xs">
            <caption className="sr-only">{m.lanes_matrix_caption()}</caption>
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50">
                <th
                  scope="col"
                  className="sticky left-0 z-10 bg-zinc-50 px-2 py-1.5 text-left font-medium text-zinc-600 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.12)]"
                >
                  {m.lanes_matrix_attribute()}
                </th>
                {columns.map((col) => (
                  <th
                    key={col.slotId}
                    scope="col"
                    tabIndex={0}
                    className="whitespace-nowrap px-1 py-1.5 text-left font-medium text-zinc-700 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset"
                    onMouseEnter={() => {
                      if (focusWins) return
                      setHighlightedSlot(col.slotId)
                    }}
                    onMouseLeave={() => {
                      if (focusWins) return
                      setHighlightedSlot(null)
                    }}
                    onFocus={() => {
                      setFocusWins(true)
                      setHighlightedSlot(col.slotId)
                    }}
                    onBlur={() => {
                      setFocusWins(false)
                      setHighlightedSlot(null)
                    }}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MATRIX_ROWS.map((row) => (
                <tr key={row.id} className="border-b border-zinc-100">
                  <th
                    scope="row"
                    className="sticky left-0 z-10 whitespace-nowrap bg-white px-2 py-1 text-left font-medium text-zinc-600 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.12)]"
                  >
                    {rowLabel(row.id)}
                  </th>
                  {columns.map((col) => {
                    const cell = getMatrixCell(row.id, col, model, way.tags, readOnly, columns)
                    const hint =
                      cell.readOnlyReason === 'edge_na'
                        ? m.lanes_matrix_edge_na()
                        : cell.readOnlyReason === 'auth'
                          ? m.editor_please_login()
                          : cell.readOnlyReason === 'pipe_positioned'
                            ? m.lanes_matrix_pipe_positioned_hint()
                            : cell.readOnlyReason === 'unsupported'
                              ? m.lanes_matrix_readonly_hint()
                              : undefined
                    return (
                      <td key={col.slotId} className="px-0.5 py-0.5 align-middle">
                        <MatrixCellFlyout
                          column={col}
                          row={row.id}
                          display={cell.display}
                          provenance={cell.provenance}
                          editable={cell.editable}
                          readOnlyHint={hint}
                          inputPlaceholder={cell.inputPlaceholder}
                          onHighlight={setHighlightedSlot}
                          onCommit={(value) => commitCell(col, row.id, value)}
                          focusWins={focusWins}
                          setFocusWins={setFocusWins}
                        />
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="border-t border-zinc-100 px-2 py-1 text-[10px] text-zinc-400">
          {m.lanes_matrix_scroll_hint()}
        </p>
      </section>
    </div>
  )
}
