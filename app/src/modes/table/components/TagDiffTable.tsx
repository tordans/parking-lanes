import * as m from '@app/paraglide/messages'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import clsx from 'clsx'
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react'
import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Input } from '../../../components/catalyst/input'
import { isYesNoCompatibleValue, YesNoRadioInput } from '../../../components/tag-editor'
import { tagEditorFieldClassName } from '../../../components/tag-editor/tag-editor-controls'
import { Tooltip } from '../../../components/Tooltip/Tooltip'
import { useBreakpoint } from '../../../hooks/useBreakpoint'
import type { TagDiffCell, TagDiffStatus, TagGroupSection, TagRow } from '../domain/tag-diff'
import { getDiffStatusClass } from '../domain/tag-diff'
import type { TableTagGroupId } from '../domain/tag-groups'
import { classifyTagKey } from '../domain/tag-groups'
import { formatTableTagKeyLabel } from '../domain/tag-key-label'
import { useTableGroupOpen, useTableGroupUiActions } from '../map/table-group-ui-store'

/* TanStack Table uses a mutable stable instance — incompatible with React Compiler memoization. */
/* oxlint-disable react/react-compiler, react-hooks-js/incompatible-library */

/** Compact default; widen on very large viewports so long keys need less hover. */
const TAG_COL_WIDTH_COMPACT = 100
const TAG_COL_WIDTH_WIDE = 148
const SEGMENT_COL_WIDTH = 200
const HEADER_ROW_HEIGHT = 36
const GROUP_HEADER_HEIGHT = 24
const ESTIMATED_ROW_HEIGHT = 28

/** Panel chrome uses `text-xs` / `text-[11px]` only (matches ModePanelIntro). */
const panelTextClassName = 'text-xs leading-tight'
const panelMetaClassName = 'text-[11px] leading-tight'

/** Rough mono `text-xs` fit — used only to decide whether to attach a full-key title. */
function isApproxTagLabelTruncated(label: string, colWidthPx: number): boolean {
  const paddingPx = 14
  const charPx = 7
  return label.length * charPx > colWidthPx - paddingPx
}

function TruncatedTagKeyLabel({
  osmKey,
  label,
  colWidthPx,
}: {
  osmKey: string
  label: string
  colWidthPx: number
}) {
  const truncated = isApproxTagLabelTruncated(label, colWidthPx)
  return (
    <span className="block truncate" title={truncated ? osmKey : undefined}>
      {label}
    </span>
  )
}
/** Vertical panel scrollport (skip the matrix’s own overflow-x scroller). */
function findNearestVerticalScrollParent(el: HTMLElement | null): HTMLElement | null {
  let node = el?.parentElement ?? null
  while (node && node !== document.body) {
    const style = getComputedStyle(node)
    if (/(auto|scroll|overlay)/.test(style.overflowY)) {
      return node
    }
    node = node.parentElement
  }
  return null
}

function groupTitle(groupId: TableTagGroupId): string {
  switch (groupId) {
    case 'centerline':
      return m.table_group_centerline()
    case 'bikelane':
      return m.table_group_bikelane()
    case 'bikelane_left':
      return m.table_group_bikelane_left()
    case 'bikelane_right':
      return m.table_group_bikelane_right()
    case 'sidewalk':
      return m.table_group_sidewalk()
    case 'sidewalk_left':
      return m.table_group_sidewalk_left()
    case 'sidewalk_right':
      return m.table_group_sidewalk_right()
  }
}

function centerColumnHighlightClass(isCenter: boolean | undefined): string | false {
  return Boolean(isCenter) && 'bg-blue-50'
}

function DiffDirectionMark({ direction }: { direction: 'left' | 'right' }) {
  const Icon = direction === 'left' ? ChevronLeft : ChevronRight
  const label =
    direction === 'left' ? m.table_diff_from_center_left() : m.table_diff_from_center_right()

  return (
    <span
      title={label}
      aria-hidden
      className="pointer-events-none absolute top-1/2 left-0 z-10 flex size-4 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 opacity-90 ring-1 ring-zinc-200"
    >
      <Icon className="size-3" strokeWidth={2.5} />
    </span>
  )
}

function NeighborImportGlyph({ side }: { side: 'left' | 'right' }) {
  // Point toward this cell: value flows in from the named neighbour.
  const Icon = side === 'left' ? ArrowRight : ArrowLeft
  return (
    <span className="relative inline-flex size-3.5 items-center justify-center">
      <Icon className="size-3" strokeWidth={2.25} aria-hidden />
      <Plus
        className={clsx(
          'absolute size-2 text-zinc-700',
          side === 'left' ? '-top-0.5 -right-0.5' : '-top-0.5 -left-0.5',
        )}
        strokeWidth={3}
        aria-hidden
      />
    </span>
  )
}

function NeighborImportButton({
  side,
  neighborValue,
  currentValue,
  hasNeighbor,
  onApply,
}: {
  side: 'left' | 'right'
  neighborValue: string | undefined
  currentValue: string | undefined
  hasNeighbor: boolean
  onApply: (value: string | undefined) => void
}) {
  const sameAsCurrent = hasNeighbor && neighborValue === currentValue
  const disabled = !hasNeighbor || sameAsCurrent
  const label = sameAsCurrent
    ? side === 'left'
      ? m.table_use_from_left_same()
      : m.table_use_from_right_same()
    : side === 'left'
      ? m.table_use_from_left()
      : m.table_use_from_right()

  return (
    <Tooltip content={label} placement="top">
      <span className="inline-flex h-5 shrink-0 self-center">
        <button
          type="button"
          disabled={disabled}
          aria-label={label}
          className={clsx(
            'flex h-5 w-5 cursor-pointer items-center justify-center bg-white/80 text-zinc-700',
            'hover:bg-zinc-50 active:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40',
            // Square against the column line; soft radius only toward the editor.
            side === 'left' && 'rounded-r-sm border-r border-zinc-200',
            side === 'right' && 'rounded-l-sm border-l border-zinc-200',
          )}
          onClick={() => onApply(neighborValue)}
        >
          <NeighborImportGlyph side={side} />
        </button>
      </span>
    </Tooltip>
  )
}

function TableTextInput({
  tagKey,
  value,
  disabled,
  onCommit,
}: {
  tagKey: string
  value: string
  disabled?: boolean
  onCommit: (value: string) => void
}) {
  const [draft, setDraft] = useState(value)

  return (
    <Input
      type="text"
      name={tagKey}
      className={clsx(tagEditorFieldClassName, 'min-w-0 flex-1')}
      value={draft}
      disabled={disabled}
      placeholder="—"
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        const next = draft.trim()
        if (next === value) return
        onCommit(next)
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur()
      }}
    />
  )
}

function EditableCell({
  tagKey,
  value,
  status,
  isCenter,
  leftValue,
  rightValue,
  hasLeft,
  hasRight,
  onCommit,
  onClear,
}: {
  tagKey: string
  value: string | undefined
  status: TagDiffStatus
  isCenter?: boolean
  leftValue: string | undefined
  rightValue: string | undefined
  hasLeft: boolean
  hasRight: boolean
  onCommit: (value: string) => void
  onClear?: () => void
}) {
  const displayValue = value ?? ''
  const useYesNo = isYesNoCompatibleValue(displayValue)

  function applyNeighbor(next: string | undefined) {
    if (next === undefined || next === '') {
      onClear?.()
      return
    }
    onCommit(next)
  }

  return (
    <div
      className={clsx(
        'group relative flex h-full items-center border-r border-b border-zinc-200',
        isCenter
          ? clsx(centerColumnHighlightClass(true), status === 'missing' && 'text-zinc-400')
          : getDiffStatusClass(status),
      )}
    >
      <NeighborImportButton
        side="left"
        neighborValue={leftValue}
        currentValue={value}
        hasNeighbor={hasLeft}
        onApply={applyNeighbor}
      />
      <div className="relative flex min-w-0 flex-1 items-center gap-0.5 px-1 py-0.5">
        <div className="min-w-0 flex-1">
          {useYesNo ? (
            <YesNoRadioInput
              name={tagKey}
              value={displayValue}
              onChange={(next) => {
                if (next === '') {
                  onClear?.()
                  return
                }
                onCommit(next)
              }}
            />
          ) : (
            <TableTextInput
              key={displayValue}
              tagKey={tagKey}
              value={displayValue}
              onCommit={onCommit}
            />
          )}
        </div>
        {value !== undefined && onClear ? (
          <button
            type="button"
            aria-label={m.editor_clear_value()}
            title={m.editor_clear_value()}
            className="absolute top-0.5 right-0.5 inline-flex size-3.5 items-center justify-center rounded-sm text-zinc-400 opacity-0 hover:bg-zinc-950/5 hover:text-red-600 group-hover:opacity-100"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onClear()
            }}
          >
            <Trash2 className="size-2.5" strokeWidth={2.25} aria-hidden />
          </button>
        ) : null}
      </div>
      <NeighborImportButton
        side="right"
        neighborValue={rightValue}
        currentValue={value}
        hasNeighbor={hasRight}
        onApply={applyNeighbor}
      />
    </div>
  )
}

function ValueCell({
  tagKey,
  value,
  status,
  editable,
  isCenter,
  leftValue,
  rightValue,
  hasLeft,
  hasRight,
  onCommit,
  onClear,
}: {
  tagKey: string
  value: string | undefined
  status: TagDiffStatus
  editable?: boolean
  isCenter?: boolean
  leftValue?: string
  rightValue?: string
  hasLeft?: boolean
  hasRight?: boolean
  onCommit?: (value: string) => void
  onClear?: () => void
}) {
  if (editable && onCommit) {
    return (
      <EditableCell
        key={`${tagKey}:${value ?? ''}`}
        tagKey={tagKey}
        value={value}
        status={status}
        isCenter={isCenter}
        leftValue={leftValue}
        rightValue={rightValue}
        hasLeft={Boolean(hasLeft)}
        hasRight={Boolean(hasRight)}
        onCommit={onCommit}
        onClear={onClear}
      />
    )
  }

  return (
    <div
      className={clsx(
        'h-full border-r border-b border-zinc-200 px-1 py-0.5 font-mono',
        panelTextClassName,
        isCenter
          ? clsx(centerColumnHighlightClass(true), status === 'missing' && 'text-zinc-400')
          : getDiffStatusClass(status),
      )}
    >
      {value ?? <span className="text-zinc-400">—</span>}
    </div>
  )
}

type SegmentColumn = {
  id: number
  tags: Record<string, string>
  reversed?: boolean
  dualSiblingOf?: number
}

type Props = {
  segments: SegmentColumn[]
  centerIndex: number
  groups: TagGroupSection[]
  editable?: boolean
  selectedSegmentId?: number
  onSelectSegment?: (wayId: number) => void
  onCellChange?: (segmentId: number, key: string, value: string) => void
  onCellClear?: (segmentId: number, key: string) => void
}

type TableMeta = {
  centerIndex: number
  centerSegmentId: number
  selectedSegmentId?: number
  editable?: boolean
  onSelectSegment?: (wayId: number) => void
  onCellChange?: (segmentId: number, key: string, value: string) => void
  onCellClear?: (segmentId: number, key: string) => void
}

type FlatItem =
  | { type: 'group'; groupId: TableTagGroupId; title: string; open: boolean; rowCount: number }
  | { type: 'row'; groupId: TableTagGroupId; row: TagRow }

const columnHelper = createColumnHelper<TagRow>()

type SegmentColumnDef = {
  id: number
  reversed?: boolean
  dualSiblingOf?: number
}

function buildSegmentColumns(segments: SegmentColumnDef[], tagColWidth: number) {
  return [
    columnHelper.accessor('key', {
      id: 'tag',
      size: tagColWidth,
      header: () => m.table_column_tag(),
      cell: (info) => {
        const key = info.getValue()
        const label = formatTableTagKeyLabel(key, classifyTagKey(key))
        return <TruncatedTagKeyLabel osmKey={key} label={label} colWidthPx={tagColWidth} />
      },
    }),
    ...segments.map((segment, segmentIndex) =>
      columnHelper.display({
        id: `way-${segment.id}`,
        size: SEGMENT_COL_WIDTH,
        header: ({ table }) => {
          const meta = table.options.meta as TableMeta
          const isCenter = segmentIndex === meta.centerIndex
          const isSelected = segment.id === meta.selectedSegmentId
          const directionMark =
            segmentIndex === 0
              ? null
              : segmentIndex <= meta.centerIndex
                ? ('left' as const)
                : ('right' as const)
          return (
            <div
              className={clsx(
                'relative flex h-full flex-col items-center justify-center gap-0.5 px-1.5 py-1 text-center',
                panelTextClassName,
                isCenter && 'bg-blue-100',
                isSelected && !isCenter && 'bg-blue-50',
              )}
            >
              {directionMark ? <DiffDirectionMark direction={directionMark} /> : null}
              <button
                type="button"
                className={clsx('font-mono text-blue-700 hover:underline', panelMetaClassName)}
                onClick={() => meta.onSelectSegment?.(segment.id)}
              >
                way/{segment.id}
                {segment.reversed ? (
                  <span className="ml-0.5 text-amber-600" title={m.table_direction_normalized()}>
                    ↺
                  </span>
                ) : null}
              </button>
              {isCenter ? (
                <span className="rounded bg-blue-600 px-1 py-px font-medium text-white">
                  {m.table_center_badge()}
                </span>
              ) : segment.dualSiblingOf != null ? (
                <span className="rounded bg-zinc-500 px-1 py-px font-medium text-white">
                  {m.table_dual_badge()}
                </span>
              ) : null}
            </div>
          )
        },
        cell: ({ row, table }) => {
          const cells = row.original.cells
          const cell = cells[segmentIndex] as TagDiffCell | undefined
          if (!cell) return null
          const meta = table.options.meta as TableMeta
          const isCenter = cell.segmentId === meta.centerSegmentId

          if (!isCenter || !meta.editable) {
            return (
              <ValueCell
                tagKey={row.original.key}
                value={cell.value}
                status={cell.status}
                isCenter={isCenter}
              />
            )
          }

          const leftCell = segmentIndex > 0 ? cells[segmentIndex - 1] : undefined
          const rightCell = segmentIndex < cells.length - 1 ? cells[segmentIndex + 1] : undefined
          return (
            <ValueCell
              tagKey={row.original.key}
              value={cell.value}
              status={cell.status}
              isCenter
              editable
              leftValue={leftCell?.value}
              rightValue={rightCell?.value}
              hasLeft={leftCell != null}
              hasRight={rightCell != null}
              onCommit={
                meta.onCellChange
                  ? (next) => meta.onCellChange?.(cell.segmentId, row.original.key, next)
                  : undefined
              }
              onClear={
                meta.onCellClear
                  ? () => meta.onCellClear?.(cell.segmentId, row.original.key)
                  : undefined
              }
            />
          )
        },
      }),
    ),
  ]
}

export function TagDiffTable({
  segments,
  centerIndex,
  groups,
  editable,
  selectedSegmentId,
  onSelectSegment,
  onCellChange,
  onCellClear,
}: Props) {
  'use no memo'

  const centerSegmentId = segments[centerIndex]?.id ?? -1
  const scrollRef = useRef<HTMLDivElement>(null)
  const { toggleGroup } = useTableGroupUiActions()
  const wideTagCol = useBreakpoint('2xl')
  const tagColWidth = wideTagCol ? TAG_COL_WIDTH_WIDE : TAG_COL_WIDTH_COMPACT

  const openByGroup = {
    centerline: useTableGroupOpen('centerline'),
    bikelane: useTableGroupOpen('bikelane'),
    bikelane_left: useTableGroupOpen('bikelane_left'),
    bikelane_right: useTableGroupOpen('bikelane_right'),
    sidewalk: useTableGroupOpen('sidewalk'),
    sidewalk_left: useTableGroupOpen('sidewalk_left'),
    sidewalk_right: useTableGroupOpen('sidewalk_right'),
  }

  const flatItems: FlatItem[] = []
  for (const section of groups) {
    const open = openByGroup[section.id]
    flatItems.push({
      type: 'group',
      groupId: section.id,
      title: groupTitle(section.id),
      open,
      rowCount: section.rows.length,
    })
    if (open) {
      for (const row of section.rows) {
        flatItems.push({ type: 'row', groupId: section.id, row })
      }
    }
  }

  // Column defs only depend on segment identity/orientation — tag edits update `data`, not columns.
  // Explicit useMemo: this file opts out of React Compiler (`use no memo`) for TanStack Table.
  const segmentColumnKey = segments
    .map((segment) => `${segment.id}:${segment.reversed ? 1 : 0}:${segment.dualSiblingOf ?? ''}`)
    .join('|')
  const columns = useMemo(
    function memoizeSegmentColumns() {
      const defs: SegmentColumnDef[] = segmentColumnKey
        .split('|')
        .filter(Boolean)
        .map((entry) => {
          const [id, reversed, dualSiblingOf] = entry.split(':')
          return {
            id: Number(id),
            reversed: reversed === '1',
            dualSiblingOf: dualSiblingOf ? Number(dualSiblingOf) : undefined,
          }
        })
      return buildSegmentColumns(defs, tagColWidth)
    },
    [segmentColumnKey, tagColWidth],
  )

  const flatRows = flatItems
    .filter((item): item is Extract<FlatItem, { type: 'row' }> => item.type === 'row')
    .map((item) => item.row)

  const table = useReactTable({
    data: flatRows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.key,
    meta: {
      centerIndex,
      centerSegmentId,
      selectedSegmentId,
      editable,
      onSelectSegment,
      onCellChange,
      onCellClear,
    } satisfies TableMeta,
  })

  const rowByKey = new Map(table.getRowModel().rows.map((row) => [row.id, row]))
  const totalWidth = table.getTotalSize()

  const rowVirtualizer = useVirtualizer({
    count: flatItems.length,
    getScrollElement: () => findNearestVerticalScrollParent(scrollRef.current),
    estimateSize: (index) =>
      flatItems[index]?.type === 'group' ? GROUP_HEADER_HEIGHT : ESTIMATED_ROW_HEIGHT,
    overscan: 12,
    measureElement:
      typeof window !== 'undefined' && !navigator.userAgent.includes('Firefox')
        ? (element) => element.getBoundingClientRect().height
        : undefined,
  })

  const virtualItems = rowVirtualizer.getVirtualItems()

  useLayoutEffect(
    function centerTableOnCenterColumn() {
      const scroller = scrollRef.current
      if (!scroller || centerIndex < 0 || centerSegmentId < 0) return

      const stickyGutter = tagColWidth
      const centerMid = tagColWidth + centerIndex * SEGMENT_COL_WIDTH + SEGMENT_COL_WIDTH / 2
      const visibleContentWidth = Math.max(0, scroller.clientWidth - stickyGutter)
      scroller.scrollLeft = Math.max(0, centerMid - stickyGutter - visibleContentWidth / 2)
    },
    [centerIndex, centerSegmentId, segments.length, totalWidth, tagColWidth],
  )

  return (
    <div className={clsx('flex min-w-0 flex-col gap-2', panelTextClassName)}>
      <div
        ref={scrollRef}
        className="w-full max-w-full overflow-x-auto overflow-y-clip rounded-md border border-zinc-200"
      >
        <div style={{ width: totalWidth, minWidth: '100%' }}>
          <div
            className="sticky top-0 z-20 flex border-b border-zinc-200 bg-zinc-200"
            style={{ height: HEADER_ROW_HEIGHT, width: totalWidth, minWidth: '100%' }}
          >
            {table.getHeaderGroups().map((headerGroup) =>
              headerGroup.headers.map((header, headerIndex) => (
                <div
                  key={header.id}
                  className={clsx(
                    'relative shrink-0 border-r border-zinc-200 font-medium tracking-wide text-zinc-700 uppercase',
                    panelMetaClassName,
                    headerIndex === 0 &&
                      'sticky left-0 z-30 flex items-center bg-zinc-200 px-1.5 py-1 text-left',
                    headerIndex === centerIndex + 1 && 'bg-blue-100',
                  )}
                  style={{ width: header.getSize() }}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </div>
              )),
            )}
          </div>

          <div
            className="relative"
            style={{ height: rowVirtualizer.getTotalSize(), width: totalWidth, minWidth: '100%' }}
          >
            {virtualItems.map((virtualItem) => {
              const item = flatItems[virtualItem.index]
              if (!item) return null

              if (item.type === 'group') {
                return (
                  <div
                    key={`group-${item.groupId}`}
                    data-index={virtualItem.index}
                    ref={rowVirtualizer.measureElement}
                    className="absolute top-0 left-0"
                    style={{
                      top: virtualItem.start,
                      width: totalWidth,
                      minWidth: '100%',
                    }}
                  >
                    <button
                      type="button"
                      aria-expanded={item.open}
                      onClick={() => toggleGroup(item.groupId)}
                      className={clsx(
                        'flex w-full items-center gap-1 border-b border-zinc-200 bg-zinc-100 px-1.5 py-1 text-left font-medium text-zinc-800 hover:bg-zinc-50',
                        panelTextClassName,
                      )}
                      style={{ width: totalWidth, minWidth: '100%' }}
                    >
                      <ChevronRight
                        aria-hidden
                        className={clsx(
                          'size-3 shrink-0 text-zinc-500 transition-transform',
                          item.open && 'rotate-90',
                        )}
                      />
                      <span>
                        {item.title}
                        <span
                          className={clsx('ml-1 font-normal text-zinc-500', panelMetaClassName)}
                        >
                          ({item.rowCount})
                        </span>
                      </span>
                    </button>
                  </div>
                )
              }

              const tableRow = rowByKey.get(item.row.key)
              if (!tableRow) return null

              return (
                <div
                  key={tableRow.id}
                  data-index={virtualItem.index}
                  ref={rowVirtualizer.measureElement}
                  className="absolute top-0 left-0 flex"
                  style={{
                    top: virtualItem.start,
                    width: totalWidth,
                    minWidth: '100%',
                  }}
                >
                  {tableRow.getVisibleCells().map((cell, cellIndex) => (
                    <div
                      key={cell.id}
                      className={clsx(
                        'relative shrink-0',
                        cellIndex === 0 &&
                          clsx(
                            'sticky left-0 z-10 border-r border-b border-zinc-200 bg-zinc-100 px-1.5 py-0.5 text-left font-mono font-medium text-zinc-700',
                            panelTextClassName,
                          ),
                        cellIndex === centerIndex + 1 && 'bg-blue-50',
                      )}
                      style={{ width: cell.column.getSize() }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className={clsx('flex flex-wrap gap-2.5 text-zinc-600', panelMetaClassName)}>
        <span className="flex items-center gap-1">
          <span className="inline-block size-2.5 rounded bg-amber-100 ring-1 ring-zinc-200" />
          {m.table_legend_changed()}
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block size-2.5 rounded bg-green-100 ring-1 ring-zinc-200" />
          {m.table_legend_added()}
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block size-2.5 rounded bg-red-100 ring-1 ring-zinc-200" />
          {m.table_legend_removed()}
        </span>
      </div>
    </div>
  )
}
