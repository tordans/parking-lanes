import * as m from '@app/paraglide/messages'
import { useState } from 'react'
import type { TagDiffCell, TagDiffStatus, TagRow } from '../domain/tag-diff'
import { getDiffStatusClass } from '../domain/tag-diff'

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ')
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
    <td
      className={cn(
        'border border-zinc-200 px-2 py-1 align-top text-sm',
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
    </td>
  )
}

function Cell({
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
    <td
      className={cn(
        'border border-zinc-200 px-2 py-1 align-top text-sm',
        getDiffStatusClass(status),
        isCenter && 'ring-2 ring-inset ring-blue-400',
      )}
    >
      {value ?? <span className="text-zinc-400">—</span>}
    </td>
  )
}

function TagRowView({
  tagKey,
  cells,
  centerSegmentId,
  editable,
  onCellChange,
  onCellClear,
}: {
  tagKey: string
  cells: TagDiffCell[]
  centerSegmentId: number
  editable?: boolean
  onCellChange?: (segmentId: number, key: string, value: string) => void
  onCellClear?: (segmentId: number, key: string) => void
}) {
  return (
    <tr className="hover:bg-zinc-50">
      <th
        scope="row"
        className="sticky left-0 z-10 border border-zinc-200 bg-zinc-100 px-2 py-1 text-left text-sm font-medium"
      >
        {tagKey}
      </th>
      {cells.map((cell) => (
        <Cell
          key={`${cell.segmentId}-${tagKey}`}
          value={cell.value}
          status={cell.status}
          isCenter={cell.segmentId === centerSegmentId}
          editable={editable}
          onCommit={onCellChange ? (next) => onCellChange(cell.segmentId, tagKey, next) : undefined}
          onClear={onCellClear ? () => onCellClear(cell.segmentId, tagKey) : undefined}
        />
      ))}
    </tr>
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
  rows: TagRow[]
  editable?: boolean
  selectedSegmentId?: number
  onSelectSegment?: (wayId: number) => void
  onCellChange?: (segmentId: number, key: string, value: string) => void
  onCellClear?: (segmentId: number, key: string) => void
}

export function TagDiffTable({
  segments,
  centerIndex,
  rows,
  editable,
  selectedSegmentId,
  onSelectSegment,
  onCellChange,
  onCellClear,
}: Props) {
  const centerSegment = segments[centerIndex]

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-lg border border-zinc-200">
        <table className="min-w-full border-collapse">
          <thead>
            <tr>
              <th className="sticky left-0 z-20 border border-zinc-200 bg-zinc-200 px-2 py-2 text-left text-xs font-semibold tracking-wide text-zinc-700 uppercase">
                {m.table_column_tag()}
              </th>
              {segments.map((segment, index) => {
                const isCenter = index === centerIndex
                const isSelected = segment.id === selectedSegmentId
                return (
                  <th
                    key={segment.id}
                    className={cn(
                      'min-w-36 border border-zinc-200 bg-zinc-200 px-2 py-2 text-center text-xs',
                      isCenter && 'bg-blue-100',
                      isSelected && !isCenter && 'ring-2 ring-blue-500',
                    )}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <button
                        type="button"
                        className="font-mono text-blue-700 hover:underline"
                        onClick={() => onSelectSegment?.(segment.id)}
                      >
                        way/{segment.id}
                        {segment.reversed ? (
                          <span
                            className="ml-1 text-amber-600"
                            title={m.table_direction_normalized()}
                          >
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
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <TagRowView
                key={row.key}
                tagKey={row.key}
                cells={row.cells}
                centerSegmentId={centerSegment?.id ?? -1}
                editable={editable}
                onCellChange={onCellChange}
                onCellClear={onCellClear}
              />
            ))}
          </tbody>
        </table>
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
