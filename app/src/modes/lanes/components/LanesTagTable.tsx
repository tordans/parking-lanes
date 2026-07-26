import { PRIMARY_LANE_KEYS } from '@osm-editor-kit/osm-lanes'
import type { Segment } from '@osm-editor-kit/osm-way-chain'
import clsx from 'clsx'

const TABLE_KEYS = [...PRIMARY_LANE_KEYS].sort()

type Props = {
  segments: Segment[]
  centerWayId: number
}

function segmentHeader(segment: Segment, isCenter: boolean): string {
  const name = segment.tags.name ?? segment.tags.ref ?? `Way ${segment.id}`
  return isCenter ? `★ ${name}` : name
}

export function LanesTagTable({ segments, centerWayId }: Props) {
  if (segments.length === 0) {
    return <p className="text-sm text-zinc-500">No segments in chain.</p>
  }

  const centerSegment = segments.find((s) => s.id === centerWayId)
  const centerTags = centerSegment?.tags ?? {}

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[480px] border-collapse text-xs">
        <thead>
          <tr className="border-b border-zinc-200 text-left text-zinc-600">
            <th className="sticky left-0 bg-white px-2 py-1.5 font-medium">Tag</th>
            {segments.map((segment) => (
              <th
                key={segment.id}
                className={clsx(
                  'px-2 py-1.5 font-medium whitespace-nowrap',
                  segment.id === centerWayId && 'text-blue-700',
                )}
              >
                {segmentHeader(segment, segment.id === centerWayId)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {TABLE_KEYS.map((key) => {
            const centerValue = centerTags[key]
            return (
              <tr key={key} className="border-b border-zinc-100">
                <td className="sticky left-0 bg-white px-2 py-1 font-mono text-zinc-500">{key}</td>
                {segments.map((segment) => {
                  const value = segment.tags[key]
                  const differs = segment.id !== centerWayId && value !== centerValue
                  return (
                    <td
                      key={`${segment.id}-${key}`}
                      className={clsx(
                        'max-w-[12rem] truncate px-2 py-1 font-mono',
                        differs && 'bg-amber-50 text-amber-900',
                        !value && 'text-zinc-300',
                      )}
                      title={value}
                    >
                      {value ?? '—'}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
