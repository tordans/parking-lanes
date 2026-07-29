import * as m from '@app/paraglide/messages'
import type { ComponentType, ReactNode } from 'react'
import type { CrossSectionDensity } from './cross-section/types'
import { CrossSectionFigure } from './CrossSectionFigure'
import { callGuideMessage, useMeasureGuideLocale } from './measure-guide-locale'
import { Code } from './presentation'
import type { MeasureGuideSectionId } from './sections'
import {
  cyclewayBufferSpec,
  cyclewayClearSpec,
  estWidthProvenanceSpec,
  maxwidthVsWidthSpec,
  otherPathSpec,
  pathSegregatedSpec,
  roadKerbSpec,
  roadParkingLaneSpec,
  roadParkingStreetSideSpec,
  roadWidthLanesSpec,
  roadWidthVsLanesSpec,
  rowCompositionSpec,
  sidewalkSpec,
  vergeSpec,
} from './specs'

export type SectionBodyProps = {
  density?: CrossSectionDensity
}

function BodyShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5 text-xs leading-relaxed text-zinc-700">{children}</div>
  )
}

function Note({ children }: { children: ReactNode }) {
  return <p className="m-0 text-[11px] text-zinc-500">{children}</p>
}

function RoadKerbBody({ density = 'panel' }: SectionBodyProps) {
  const locale = useMeasureGuideLocale()
  return (
    <BodyShell>
      <p className="m-0">{callGuideMessage(m.width_guide_road_kerb_body, locale)}</p>
      <CrossSectionFigure
        spec={roadKerbSpec}
        density={density}
        title={callGuideMessage(m.width_guide_road_kerb_title, locale)}
      />
      <Note>{callGuideMessage(m.width_guide_road_kerb_note, locale)}</Note>
    </BodyShell>
  )
}

function RoadParkingBranchBody({ density = 'panel' }: SectionBodyProps) {
  const locale = useMeasureGuideLocale()
  return (
    <BodyShell>
      <p className="m-0">{callGuideMessage(m.width_guide_road_parking_branch_body, locale)}</p>
      <div className="grid grid-cols-2 gap-2">
        <div className="min-w-0">
          <CrossSectionFigure
            spec={roadParkingLaneSpec}
            density={density}
            title={callGuideMessage(m.width_guide_road_parking_branch_title, locale)}
            ariaLabel="parking:*=lane"
          />
          <p className="m-0 mt-1 text-[11px] leading-snug text-zinc-600">
            <Code>parking:*=lane</Code>
          </p>
        </div>
        <div className="min-w-0">
          <CrossSectionFigure
            spec={roadParkingStreetSideSpec}
            density={density}
            title={callGuideMessage(m.width_guide_road_parking_branch_title, locale)}
            ariaLabel="parking:*=street_side"
          />
          <p className="m-0 mt-1 text-[11px] leading-snug text-zinc-600">
            <Code>parking:*=street_side</Code>
          </p>
        </div>
      </div>
    </BodyShell>
  )
}

function RoadWidthLanesBody({ density = 'panel' }: SectionBodyProps) {
  const locale = useMeasureGuideLocale()
  return (
    <BodyShell>
      <p className="m-0">{callGuideMessage(m.width_guide_road_width_lanes_body, locale)}</p>
      <CrossSectionFigure
        spec={roadWidthLanesSpec}
        density={density}
        title={callGuideMessage(m.width_guide_road_width_lanes_title, locale)}
      />
    </BodyShell>
  )
}

function RoadWidthVsLanesBody({ density = 'panel' }: SectionBodyProps) {
  const locale = useMeasureGuideLocale()
  return (
    <BodyShell>
      <p className="m-0">{callGuideMessage(m.width_guide_road_width_vs_lanes_body, locale)}</p>
      <CrossSectionFigure
        spec={roadWidthVsLanesSpec}
        density={density}
        title={callGuideMessage(m.width_guide_road_width_vs_lanes_title, locale)}
      />
    </BodyShell>
  )
}

function CyclewayClearBody({ density = 'panel' }: SectionBodyProps) {
  const locale = useMeasureGuideLocale()
  return (
    <BodyShell>
      <p className="m-0">{callGuideMessage(m.width_guide_cycleway_clear_body, locale)}</p>
      <CrossSectionFigure
        spec={cyclewayClearSpec}
        density={density}
        title={callGuideMessage(m.width_guide_cycleway_clear_title, locale)}
      />
    </BodyShell>
  )
}

function CyclewayBufferBody({ density = 'panel' }: SectionBodyProps) {
  const locale = useMeasureGuideLocale()
  return (
    <BodyShell>
      <p className="m-0">{callGuideMessage(m.width_guide_cycleway_buffer_body, locale)}</p>
      <CrossSectionFigure
        spec={cyclewayBufferSpec}
        density={density}
        title={callGuideMessage(m.width_guide_cycleway_buffer_title, locale)}
      />
    </BodyShell>
  )
}

function PathSegregatedBody({ density = 'panel' }: SectionBodyProps) {
  const locale = useMeasureGuideLocale()
  return (
    <BodyShell>
      <p className="m-0">{callGuideMessage(m.width_guide_path_segregated_body, locale)}</p>
      <CrossSectionFigure
        spec={pathSegregatedSpec}
        density={density}
        title={callGuideMessage(m.width_guide_path_segregated_title, locale)}
      />
      <Note>{callGuideMessage(m.width_guide_path_segregated_note, locale)}</Note>
    </BodyShell>
  )
}

function SidewalkBody({ density = 'panel' }: SectionBodyProps) {
  const locale = useMeasureGuideLocale()
  return (
    <BodyShell>
      <p className="m-0">{callGuideMessage(m.width_guide_sidewalk_body, locale)}</p>
      <CrossSectionFigure
        spec={sidewalkSpec}
        density={density}
        title={callGuideMessage(m.width_guide_sidewalk_title, locale)}
      />
    </BodyShell>
  )
}

function VergeBody({ density = 'panel' }: SectionBodyProps) {
  const locale = useMeasureGuideLocale()
  return (
    <BodyShell>
      <p className="m-0">{callGuideMessage(m.width_guide_verge_body, locale)}</p>
      <CrossSectionFigure
        spec={vergeSpec}
        density={density}
        title={callGuideMessage(m.width_guide_verge_title, locale)}
      />
    </BodyShell>
  )
}

function OtherPathBody({ density = 'panel' }: SectionBodyProps) {
  const locale = useMeasureGuideLocale()
  return (
    <BodyShell>
      <p className="m-0">{callGuideMessage(m.width_guide_other_path_body, locale)}</p>
      <CrossSectionFigure
        spec={otherPathSpec}
        density={density}
        title={callGuideMessage(m.width_guide_other_path_title, locale)}
      />
    </BodyShell>
  )
}

function MaxwidthVsWidthBody({ density = 'panel' }: SectionBodyProps) {
  const locale = useMeasureGuideLocale()
  return (
    <BodyShell>
      <p className="m-0">{callGuideMessage(m.width_guide_maxwidth_vs_width_body, locale)}</p>
      <CrossSectionFigure
        spec={maxwidthVsWidthSpec}
        density={density}
        title={callGuideMessage(m.width_guide_maxwidth_vs_width_title, locale)}
      />
    </BodyShell>
  )
}

function EstWidthProvenanceBody({ density = 'panel' }: SectionBodyProps) {
  const locale = useMeasureGuideLocale()
  return (
    <BodyShell>
      <p className="m-0">{callGuideMessage(m.width_guide_est_width_provenance_body, locale)}</p>
      <CrossSectionFigure
        spec={estWidthProvenanceSpec}
        density={density}
        title={callGuideMessage(m.width_guide_est_width_provenance_title, locale)}
      />
    </BodyShell>
  )
}

function NarrowingsBody(_props: SectionBodyProps) {
  const locale = useMeasureGuideLocale()
  return (
    <BodyShell>
      <p className="m-0">{callGuideMessage(m.width_guide_narrowings_body, locale)}</p>
    </BodyShell>
  )
}

function RowCompositionBody({ density = 'panel' }: SectionBodyProps) {
  const locale = useMeasureGuideLocale()
  return (
    <BodyShell>
      <p className="m-0">{callGuideMessage(m.width_guide_row_composition_body, locale)}</p>
      <CrossSectionFigure
        spec={rowCompositionSpec}
        density={density}
        title={callGuideMessage(m.width_guide_row_composition_title, locale)}
      />
    </BodyShell>
  )
}

/** Id → body component. Kept out of `sections.ts` so the registry stays React-free. */
export const SECTION_BODIES: Record<MeasureGuideSectionId, ComponentType<SectionBodyProps>> = {
  road_kerb: RoadKerbBody,
  road_parking_branch: RoadParkingBranchBody,
  road_width_lanes: RoadWidthLanesBody,
  road_width_vs_lanes: RoadWidthVsLanesBody,
  cycleway_clear: CyclewayClearBody,
  cycleway_buffer: CyclewayBufferBody,
  path_segregated: PathSegregatedBody,
  sidewalk: SidewalkBody,
  verge: VergeBody,
  other_path: OtherPathBody,
  maxwidth_vs_width: MaxwidthVsWidthBody,
  est_width_provenance: EstWidthProvenanceBody,
  narrowings: NarrowingsBody,
  row_composition: RowCompositionBody,
}
