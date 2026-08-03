import * as m from '@app/paraglide/messages'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import clsx from 'clsx'
import { ChevronRight, CornerDownLeft, CornerDownRight, Plus, Trash2 } from 'lucide-react'
import { useRef, useState } from 'react'
import { Input } from '../../../components/catalyst/input'
import { isYesNoCompatibleValue, YesNoRadioInput } from '../../../components/tag-editor'
import {
  tagEditorFieldClassName,
  tagEditorValueButtonDividerClassName,
  tagEditorValueButtonGroupCompactClassName,
} from '../../../components/tag-editor/tag-editor-controls'
import { Tooltip } from '../../../components/Tooltip/Tooltip'
import type { TagDiffCell, TagDiffStatus, TagGroupSection, TagRow } from '../domain/tag-diff'
import { getDiffStatusClass } from '../domain/tag-diff'
import type { TableTagGroupId } from '../domain/tag-groups'
import { useTableGroupOpen, useTableGroupUiActions } from '../map/table-group-ui-store'

/* TanStack Table uses a mutable stable instance — incompatible with React Compiler memoization. */
/* oxlint-disable react/react-compiler, react-hooks-js/incompatible-library */

const TAG_COL_WIDTH = 132
const SEGMENT_COL_WIDTH = 200
const HEADER_ROW_HEIGHT = 44
const GROUP_HEADER_HEIGHT = 24
const ESTIMATED_ROW_HEIGHT = 28

/** Panel chrome uses `text-xs` / `text-[11px]` only (matches ModePanelIntro). */
const panelTextClassName = 'text-xs leading-tight'
const panelMetaClassName = 'text-[11px] leading-tight'

function groupTitle(groupId: TableTagGroupId): string {
  switch (groupId) {
    case 'centerline':
      return m.table_group_centerline()
    case 'bikelane_left':
      return m.table_group_bikelane_left()
    case 'bikelane_right':
      return m.table_group_bikelane_right()
    case 'sidewalk_left':
      return m.table_group_sidewalk_left()
    case 'sidewalk_right':
      return m.table_group_sidewalk_right()
  }
}

function NeighborImportGlyph({ side }: { side: 'left' | 'right' }) {
  const Icon = side === 'left' ? CornerDownLeft : CornerDownRight
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

function NeighborImportButtons({
  leftValue,
  rightValue,
  hasLeft,
  hasRight,
  disabled,
  onApply,
}: {
  leftValue: string | undefined
  rightValue: string | undefined
  hasLeft: boolean
  hasRight: boolean
  disabled?: boolean
  onApply: (value: string | undefined) => void
}) {
  return (
    <div className={clsx(tagEditorValueButtonGroupCompactClassName, 'shrink-0')}>
      <Tooltip content={m.table_use_from_left()} placement="top">
        <span className="inline-flex">
          <button
            type="button"
            disabled={disabled || !hasLeft}
            aria-label={m.table_use_from_left()}
            className="flex h-5 w-5 cursor-pointer items-center justify-center bg-white text-zinc-700 hover:bg-zinc-50 active:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
            onClick={() => onApply(leftValue)}
          >
            <NeighborImportGlyph side="left" />
          </button>
        </span>
      </Tooltip>
      <Tooltip content={m.table_use_from_right()} placement="top">
        <span className="inline-flex">
          <button
            type="button"
            disabled={disabled || !hasRight}
            aria-label={m.table_use_from_right()}
            className={clsx(
              'flex h-5 w-5 cursor-pointer items-center justify-center bg-white text-zinc-700 hover:bg-zinc-50 active:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40',
              tagEditorValueButtonDividerClassName,
            )}
            onClick={() => onApply(rightValue)}
          >
            <NeighborImportGlyph side="right" />
          </button>
        </span>
      </Tooltip>
    </div>
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

  return (
    <div
      className={clsx(
        'group relative flex h-full items-center gap-0.5 border-r border-b border-zinc-200 px-1 py-0.5',
        getDiffStatusClass(status),
        isCenter && 'ring-2 ring-inset ring-blue-400',
      )}
    >
      <NeighborImportButtons
        leftValue={leftValue}
        rightValue={rightValue}
        hasLeft={hasLeft}
        hasRight={hasRight}
        onApply={(next) => {
          if (next === undefined || next === '') {
            onClear?.()
            return
          }
          onCommit(next)
        }}
      />
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
  leftValue: string | undefined
  rightValue: string | undefined
  hasLeft: boolean
  hasRight: boolean
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
        hasLeft={hasLeft}
        hasRight={hasRight}
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
        getDiffStatusClass(status),
        isCenter && 'ring-2 ring-inset ring-blue-400',
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
  centerSegmentId: number
  editable?: boolean
  onCellChange?: (segmentId: number, key: string, value: string) => void
  onCellClear?: (segmentId: number, key: string) => void
}

type FlatItem =
  | { type: 'group'; groupId: TableTagGroupId; title: string; open: boolean; rowCount: number }
  | { type: 'row'; groupId: TableTagGroupId; row: TagRow }

const columnHelper = createColumnHelper<TagRow>()

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

  const centerSegment = segments[centerIndex]
  const scrollRef = useRef<HTMLDivElement>(null)
  const { toggleGroup } = useTableGroupUiActions()

  const openByGroup = {
    centerline: useTableGroupOpen('centerline'),
    bikelane_left: useTableGroupOpen('bikelane_left'),
    bikelane_right: useTableGroupOpen('bikelane_right'),
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

  const columns = [
    columnHelper.accessor('key', {
      id: 'tag',
      size: TAG_COL_WIDTH,
      header: () => m.table_column_tag(),
      cell: (info) => info.getValue(),
    }),
    ...segments.map((segment, segmentIndex) =>
      columnHelper.display({
        id: `way-${segment.id}`,
        size: SEGMENT_COL_WIDTH,
        header: () => {
          const isCenter = segmentIndex === centerIndex
          const isSelected = segment.id === selectedSegmentId
          return (
            <div
              className={clsx(
                'flex h-full flex-col items-center justify-center gap-0.5 px-1.5 py-1 text-center',
                panelTextClassName,
                isCenter && 'bg-blue-100',
                isSelected && !isCenter && 'ring-2 ring-inset ring-blue-500',
              )}
            >
              <button
                type="button"
                className={clsx('font-mono text-blue-700 hover:underline', panelMetaClassName)}
                onClick={() => onSelectSegment?.(segment.id)}
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
              ) : null}
              {segment.tags.name || segment.tags.ref || segment.tags.highway ? (
                <span
                  className={clsx(
                    'max-w-36 truncate font-medium text-zinc-900',
                    panelTextClassName,
                  )}
                >
                  {segment.tags.name ?? segment.tags.ref ?? segment.tags.highway}
                </span>
              ) : null}
            </div>
          )
        },
        cell: ({ row, table }) => {
          const cells = row.original.cells
          const cell = cells[segmentIndex] as TagDiffCell | undefined
          if (!cell) return null
          const leftCell = segmentIndex > 0 ? cells[segmentIndex - 1] : undefined
          const rightCell = segmentIndex < cells.length - 1 ? cells[segmentIndex + 1] : undefined
          const meta = table.options.meta as TableMeta
          return (
            <ValueCell
              tagKey={row.original.key}
              value={cell.value}
              status={cell.status}
              isCenter={cell.segmentId === meta.centerSegmentId}
              editable={meta.editable}
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

  const flatRows = flatItems
    .filter((item): item is Extract<FlatItem, { type: 'row' }> => item.type === 'row')
    .map((item) => item.row)

  const table = useReactTable({
    data: flatRows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.key,
    meta: {
      centerSegmentId: centerSegment?.id ?? -1,
      editable,
      onCellChange,
      onCellClear,
    } satisfies TableMeta,
  })

  const rowByKey = new Map(table.getRowModel().rows.map((row) => [row.id, row]))
  const totalWidth = table.getTotalSize()

  const rowVirtualizer = useVirtualizer({
    count: flatItems.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: (index) =>
      flatItems[index]?.type === 'group' ? GROUP_HEADER_HEIGHT : ESTIMATED_ROW_HEIGHT,
    overscan: 12,
    measureElement:
      typeof window !== 'undefined' && !navigator.userAgent.includes('Firefox')
        ? (element) => element.getBoundingClientRect().height
        : undefined,
  })

  const virtualItems = rowVirtualizer.getVirtualItems()

  return (
    <div className={clsx('flex flex-col gap-2', panelTextClassName)}>
      <div
        ref={scrollRef}
        className="max-h-[min(28rem,calc(var(--app-height,100dvh)-14rem))] overflow-auto rounded-md border border-zinc-200"
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
                    'shrink-0 border-r border-zinc-200 font-medium tracking-wide text-zinc-700 uppercase',
                    panelMetaClassName,
                    headerIndex === 0 &&
                      'sticky left-0 z-30 flex items-center bg-zinc-200 px-1.5 py-1 text-left',
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
                      width: totalWidth,
                      minWidth: '100%',
                      transform: `translateY(${virtualItem.start}px)`,
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
                  className="absolute top-0 left-0 flex hover:bg-zinc-50"
                  style={{
                    width: totalWidth,
                    minWidth: '100%',
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                >
                  {tableRow.getVisibleCells().map((cell, cellIndex) => (
                    <div
                      key={cell.id}
                      className={clsx(
                        'shrink-0',
                        cellIndex === 0 &&
                          clsx(
                            'sticky left-0 z-10 border-r border-b border-zinc-200 bg-zinc-100 px-1.5 py-0.5 text-left font-mono font-medium text-zinc-700',
                            panelTextClassName,
                          ),
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
