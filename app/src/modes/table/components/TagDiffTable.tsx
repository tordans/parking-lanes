import * as m from '@app/paraglide/messages'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import clsx from 'clsx'
import { ChevronRight } from 'lucide-react'
import { useRef, useState } from 'react'
import type { TagDiffCell, TagDiffStatus, TagGroupSection, TagRow } from '../domain/tag-diff'
import { getDiffStatusClass } from '../domain/tag-diff'
import type { TableTagGroupId } from '../domain/tag-groups'
import { useTableGroupOpen, useTableGroupUiActions } from '../map/table-group-ui-store'

/* TanStack Table uses a mutable stable instance — incompatible with React Compiler memoization. */
/* oxlint-disable react/react-compiler, react-hooks-js/incompatible-library */

const TAG_COL_WIDTH = 160
const SEGMENT_COL_WIDTH = 144
const HEADER_ROW_HEIGHT = 64
const GROUP_HEADER_HEIGHT = 32
const ESTIMATED_ROW_HEIGHT = 40

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

function EditableCell({
  value,
  status,
  isCenter,
  onCommit,
  onClear,
}: {
  value: string | undefined
  status: TagDiffStatus
  isCenter?: boolean
  onCommit: (value: string) => void
  onClear?: () => void
}) {
  const [draft, setDraft] = useState(value ?? '')

  return (
    <div
      className={clsx(
        'h-full border-r border-b border-zinc-200 px-2 py-1 text-sm',
        getDiffStatusClass(status),
        isCenter && 'ring-2 ring-inset ring-blue-400',
      )}
    >
      <input
        type="text"
        className="w-full min-w-24 bg-transparent outline-none"
        value={draft}
        placeholder="—"
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          const next = draft.trim()
          const current = value ?? ''
          if (next === current) return
          onCommit(next)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur()
        }}
      />
      {value !== undefined && onClear ? (
        <button
          type="button"
          className="mt-0.5 text-xs text-zinc-500 hover:text-red-600"
          onClick={onClear}
        >
          {m.table_clear_cell()}
        </button>
      ) : null}
    </div>
  )
}

function ValueCell({
  value,
  status,
  editable,
  isCenter,
  onCommit,
  onClear,
}: {
  value: string | undefined
  status: TagDiffStatus
  editable?: boolean
  isCenter?: boolean
  onCommit?: (value: string) => void
  onClear?: () => void
}) {
  if (editable && onCommit) {
    return (
      <EditableCell
        key={value ?? ''}
        value={value}
        status={status}
        isCenter={isCenter}
        onCommit={onCommit}
        onClear={onClear}
      />
    )
  }

  return (
    <div
      className={clsx(
        'h-full border-r border-b border-zinc-200 px-2 py-1 text-sm',
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
                'flex h-full flex-col items-center justify-center gap-1 px-2 py-2 text-center text-xs',
                isCenter && 'bg-blue-100',
                isSelected && !isCenter && 'ring-2 ring-inset ring-blue-500',
              )}
            >
              <button
                type="button"
                className="font-mono text-blue-700 hover:underline"
                onClick={() => onSelectSegment?.(segment.id)}
              >
                way/{segment.id}
                {segment.reversed ? (
                  <span className="ml-1 text-amber-600" title={m.table_direction_normalized()}>
                    ↺
                  </span>
                ) : null}
              </button>
              {isCenter ? (
                <span className="rounded bg-blue-600 px-1.5 py-0.5 text-[10px] text-white">
                  {m.table_center_badge()}
                </span>
              ) : null}
              {segment.tags.name || segment.tags.ref || segment.tags.highway ? (
                <span className="max-w-32 truncate text-[10px] font-normal text-zinc-600">
                  {segment.tags.name ?? segment.tags.ref ?? segment.tags.highway}
                </span>
              ) : null}
            </div>
          )
        },
        cell: ({ row, table }) => {
          const cell = row.original.cells[segmentIndex] as TagDiffCell | undefined
          if (!cell) return null
          const meta = table.options.meta as TableMeta
          return (
            <ValueCell
              value={cell.value}
              status={cell.status}
              isCenter={cell.segmentId === meta.centerSegmentId}
              editable={meta.editable}
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
    <div className="flex flex-col gap-3">
      <div
        ref={scrollRef}
        className="max-h-[min(28rem,calc(var(--app-height,100dvh)-14rem))] overflow-auto rounded-lg border border-zinc-200"
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
                    'shrink-0 border-r border-zinc-200 text-xs font-semibold tracking-wide text-zinc-700 uppercase',
                    headerIndex === 0 &&
                      'sticky left-0 z-30 flex items-center bg-zinc-200 px-2 py-2 text-left',
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
                      className="flex w-full items-center gap-1.5 border-b border-zinc-200 bg-zinc-100 px-2 py-1.5 text-left text-xs font-semibold tracking-wide text-zinc-700 uppercase hover:bg-zinc-50"
                      style={{ width: totalWidth, minWidth: '100%' }}
                    >
                      <ChevronRight
                        aria-hidden
                        className={clsx(
                          'size-3.5 shrink-0 text-zinc-500 transition-transform',
                          item.open && 'rotate-90',
                        )}
                      />
                      <span>
                        {item.title}
                        <span className="ml-1.5 font-normal text-zinc-500 normal-case">
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
                          'sticky left-0 z-10 border-r border-b border-zinc-200 bg-zinc-100 px-2 py-1 text-left text-sm font-medium',
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

      <div className="flex flex-wrap gap-3 text-xs text-zinc-600">
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-amber-100 ring-1 ring-zinc-200" />
          {m.table_legend_changed()}
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-green-100 ring-1 ring-zinc-200" />
          {m.table_legend_added()}
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-red-100 ring-1 ring-zinc-200" />
          {m.table_legend_removed()}
        </span>
      </div>
    </div>
  )
}
