import * as m from '@app/paraglide/messages'
import {
  type RoadSpaceSlot,
  type RoadSpaceSlotKind,
  type SeparatelyMappedSidepath,
} from '@osm-editor-kit/osm-lane-diagram'
import { useFeatureSelectionActions } from '../../shell/map/feature-selection-store'
import {
  formatRoadSpaceWidthLabel,
  RoadSpaceDiagram,
  RoadSpaceMedianCrossingLegendIcon,
  RoadSpaceMedianVergeLegendIcon,
  ROAD_SPACE_CALCULATED_WIDTH_COLOR,
  ROAD_SPACE_KIND_SWATCH,
  ROAD_SPACE_SIBLING_SWATCH,
  ROAD_SPACE_TAGGED_WIDTH_COLOR,
} from './components/RoadSpaceDiagram'
import { useRoadSpaceChain } from './domain/use-road-space-chain'
import {
  separatelyMappedSidepathKey,
  useSeparatelyMappedSidepathTargets,
} from './domain/use-separately-mapped-sidepath-targets'
import { useHighlightedLaneSlotId } from './map/lanes-map-store'

const LEGEND_KINDS: Array<{ kind: RoadSpaceSlotKind; labelKey: () => string }> = [
  { kind: 'motor', labelKey: () => m.lanes_legend_motor() },
  { kind: 'bus', labelKey: () => m.lanes_legend_bus() },
  { kind: 'cycle', labelKey: () => m.lanes_legend_cycle() },
  { kind: 'sidewalk', labelKey: () => m.lanes_legend_sidewalk() },
  { kind: 'shared_path', labelKey: () => m.lanes_legend_shared() },
]

function separatelyMappedNote(hint: SeparatelyMappedSidepath): string {
  if (hint.prefix === 'sidewalk') {
    return hint.side === 'left'
      ? m.lanes_separately_mapped_sidewalk_left()
      : m.lanes_separately_mapped_sidewalk_right()
  }
  return hint.side === 'left'
    ? m.lanes_separately_mapped_cycleway_left()
    : m.lanes_separately_mapped_cycleway_right()
}

function uniqueSeparatelyMapped(
  hints: SeparatelyMappedSidepath[] | undefined,
): SeparatelyMappedSidepath[] {
  if (!hints || hints.length === 0) return []
  const seen = new Set<string>()
  const out: SeparatelyMappedSidepath[] = []
  for (const h of hints) {
    const key = `${h.prefix}:${h.side}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push(h)
  }
  return out
}

function SeparatelyMappedNote({
  hint,
  wayId,
  onSelect,
}: {
  hint: SeparatelyMappedSidepath
  wayId: number | null
  onSelect: (wayId: number) => void
}) {
  const label = separatelyMappedNote(hint)
  if (wayId == null) {
    return <li>{label}</li>
  }
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(wayId)}
        className="cursor-pointer text-left text-zinc-700 underline decoration-zinc-400/80 underline-offset-2 hover:text-zinc-900 hover:decoration-zinc-700"
      >
        {label}
      </button>
    </li>
  )
}

function summarizeSlots(slots: RoadSpaceSlot[]): string {
  const motor = slots.filter((s) => s.kind === 'motor' || s.kind === 'both_ways').length
  const bus = slots.filter((s) => s.kind === 'bus').length
  const cycle = slots.filter((s) => s.kind === 'cycle').length
  const sidewalk = slots.filter((s) => s.kind === 'sidewalk' || s.kind === 'shared_path').length
  return m.lanes_diagram_aria({
    motor: String(motor),
    bus: String(bus),
    cycle: String(cycle),
    sidewalk: String(sidewalk),
  })
}

function segmentTitle(tags: Record<string, string> | undefined, wayId: number | undefined): string {
  if (wayId == null) return m.lanes_diagram_no_selection()
  if (tags?.name) return tags.name
  if (tags?.ref) return tags.ref
  return `way/${wayId}`
}

function firstWidthLabel(
  slots: RoadSpaceSlot[],
  provenance: 'tagged' | 'inferred' | 'default',
  fallback: string,
): string {
  for (const slot of slots) {
    if (slot.widthProvenance === provenance && slot.widthM > 0) {
      return formatRoadSpaceWidthLabel(slot.widthM)
    }
  }
  return fallback
}

export function LanesDiagramPanel() {
  const { scene, currentSlots, centerWayId, centerSegment } = useRoadSpaceChain()
  const highlightedSlotId = useHighlightedLaneSlotId()
  const { selectFeature } = useFeatureSelectionActions()

  const title = segmentTitle(centerSegment?.tags, centerWayId)
  const ariaLabel = scene ? summarizeSlots(currentSlots) : m.lanes_diagram_no_selection()
  const separateHints = uniqueSeparatelyMapped(scene?.separatelyMapped)
  const sidepathTargets = useSeparatelyMappedSidepathTargets(centerWayId, separateHints)
  const taggedLegendSample = firstWidthLabel(currentSlots, 'tagged', '3.2')
  const calculatedLegendSample =
    firstWidthLabel(currentSlots, 'inferred', '') || firstWidthLabel(currentSlots, 'default', '3.0')

  return (
    <div className="flex h-full min-h-0 flex-col gap-2 overflow-hidden p-3">
      <header className="flex shrink-0 flex-col gap-0.5">
        <div className="truncate text-sm font-semibold text-zinc-900">{title}</div>
        <p className="text-xs text-zinc-500">{m.lanes_diagram_render_only()}</p>
      </header>

      <div className="min-h-0 w-full flex-1 overflow-y-auto">
        {scene ? (
          <div className="flex w-full flex-col gap-2">
            <div className="flex w-full justify-center">
              <RoadSpaceDiagram
                scene={scene}
                ariaLabel={ariaLabel}
                highlightedSlotId={highlightedSlotId}
                className="max-w-full"
                siblingLabel={m.lanes_diagram_sibling()}
                junctionLabel={m.lanes_junction_label()}
              />
            </div>
            {separateHints.length > 0 ? (
              <ul className="m-0 list-none space-y-0.5 pl-0 text-[11px] leading-snug text-zinc-500">
                {separateHints.map((hint) => {
                  const key = separatelyMappedSidepathKey(hint)
                  return (
                    <SeparatelyMappedNote
                      key={key}
                      hint={hint}
                      wayId={sidepathTargets[key] ?? null}
                      onSelect={(wayId) => selectFeature({ type: 'way', id: wayId })}
                    />
                  )
                })}
              </ul>
            ) : null}
            {scene.unresolvedSibling ? (
              <p className="m-0 text-[11px] leading-snug text-zinc-500">
                {m.lanes_unresolved_dual_sibling()}
              </p>
            ) : null}
            {scene.placementIssues && scene.placementIssues.length > 0 ? (
              <ul className="m-0 list-none space-y-0.5 pl-0 text-[11px] leading-snug text-amber-800">
                {scene.placementIssues.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : (
          <p className="text-xs text-zinc-400">{m.lanes_diagram_no_selection()}</p>
        )}
      </div>

      <footer className="flex shrink-0 flex-col gap-1.5 border-t border-zinc-200/80 pt-2">
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-zinc-600">
          {LEGEND_KINDS.map(({ kind, labelKey }) => (
            <span key={kind} className="inline-flex items-center gap-1">
              <span
                className="size-2.5 rounded-sm border border-zinc-300/80"
                style={{ backgroundColor: ROAD_SPACE_KIND_SWATCH[kind] }}
                aria-hidden
              />
              {labelKey()}
            </span>
          ))}
          <span className="inline-flex items-center gap-1">
            <RoadSpaceMedianVergeLegendIcon className="size-2.5 shrink-0" />
            {m.lanes_legend_median()}
          </span>
          <span className="inline-flex items-center gap-1">
            <RoadSpaceMedianCrossingLegendIcon className="size-2.5 shrink-0" />
            {m.lanes_legend_crossing_median()}
          </span>
          <span className="inline-flex items-center gap-1">
            <span
              className="size-2.5 rounded-sm border border-zinc-300/80"
              style={{ backgroundColor: ROAD_SPACE_SIBLING_SWATCH }}
              aria-hidden
            />
            {m.lanes_legend_sibling()}
          </span>
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-zinc-500">
          <span className="inline-flex items-center gap-1">
            <span
              className="font-mono text-[9px]"
              style={{ color: ROAD_SPACE_CALCULATED_WIDTH_COLOR }}
            >
              {calculatedLegendSample}
            </span>
            {m.lanes_legend_default_width()}
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="font-mono text-[9px]" style={{ color: ROAD_SPACE_TAGGED_WIDTH_COLOR }}>
              {taggedLegendSample}
            </span>
            {m.lanes_legend_tagged_width()}
          </span>
        </div>
        <p className="text-[10px] leading-snug text-zinc-400">{m.lanes_diagram_orientation()}</p>
      </footer>
    </div>
  )
}
