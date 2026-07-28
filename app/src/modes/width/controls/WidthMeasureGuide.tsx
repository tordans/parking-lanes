import * as m from '@app/paraglide/messages'
import type { OsmTags } from '@osm-editor-kit/osm-data'
import type { SidepathPrefix } from '@osm-editor-kit/osm-sidepath-tags'
import type { ReactNode } from 'react'
import { Badge } from '../../../components/catalyst/badge'
import {
  widthBufferIncludesPaintGraphic,
  wikiParkingLaneGraphic,
  wikiParkingStreetSideGraphic,
  wikiWidthCarriagewayGraphic,
} from '../domain/width-graphics'
import {
  widthMeasureGuideKind,
  type WidthMeasureGuideKind,
} from '../domain/width-measure-guide-kind'

const wikiLinkClass = 'text-blue-600 hover:underline'

function WikiLink(props: { href: string; children: ReactNode }) {
  return (
    <a href={props.href} target="_blank" rel="noreferrer" className={wikiLinkClass}>
      {props.children}
    </a>
  )
}

function Code({ children }: { children: ReactNode }) {
  return <code className="font-mono text-[0.9em] text-zinc-800">{children}</code>
}

function GuideImage(props: { src: string; alt: string; caption?: string }) {
  return (
    <figure className="m-0 flex flex-col gap-1">
      <img
        src={props.src}
        alt={props.alt}
        className="w-full rounded-sm border border-zinc-200 bg-white object-contain"
      />
      {props.caption ? (
        <figcaption className="text-[11px] text-zinc-500">{props.caption}</figcaption>
      ) : null}
    </figure>
  )
}

function ParkingCompare() {
  return (
    <div className="grid grid-cols-2 gap-2">
      <figure className="m-0 flex flex-col gap-1">
        <img
          src={wikiParkingLaneGraphic()}
          alt=""
          className="w-full rounded-sm border border-zinc-200 bg-white object-contain"
        />
        <figcaption className="text-[11px] leading-snug text-zinc-600">
          <Code>parking:*=lane</Code>
          <span className="block text-zinc-500">{m.width_guide_parking_lane_caption()}</span>
        </figcaption>
      </figure>
      <figure className="m-0 flex flex-col gap-1">
        <img
          src={wikiParkingStreetSideGraphic()}
          alt=""
          className="w-full rounded-sm border border-zinc-200 bg-white object-contain"
        />
        <figcaption className="text-[11px] leading-snug text-zinc-600">
          <Code>parking:*=street_side</Code>
          <span className="block text-zinc-500">{m.width_guide_parking_street_side_caption()}</span>
        </figcaption>
      </figure>
    </div>
  )
}

function RoadGuide() {
  return (
    <div className="flex flex-col gap-2.5 text-xs leading-relaxed text-zinc-700">
      <p className="m-0">{m.width_guide_road_kerb()}</p>
      <GuideImage
        src={wikiWidthCarriagewayGraphic()}
        alt={m.width_guide_road_diagram_alt()}
        caption={m.width_guide_road_diagram_caption()}
      />
      <p className="m-0">{m.width_guide_road_parking()}</p>
      <ParkingCompare />
      <p className="m-0">{m.width_guide_road_baseline()}</p>
      <p className="m-0 text-[11px] text-zinc-500">
        <WikiLink href="https://wiki.openstreetmap.org/wiki/Key:width">
          {m.width_guide_link_key_width()}
        </WikiLink>
        {' · '}
        <WikiLink href="https://wiki.openstreetmap.org/wiki/DE:Parken_im_Straßenraum">
          {m.width_guide_link_parking_de()}
        </WikiLink>
        {' · '}
        <WikiLink href="https://wiki.openstreetmap.org/wiki/Tag:parking%3Dstreet_side/street_side_vs_lane">
          {m.width_guide_link_lane_vs_street_side()}
        </WikiLink>
      </p>
    </div>
  )
}

function SidewalkGuide() {
  return (
    <div className="flex flex-col gap-2.5 text-xs leading-relaxed text-zinc-700">
      <p className="m-0">{m.width_guide_sidewalk_average()}</p>
      <p className="m-0">{m.width_guide_sidewalk_verge()}</p>
      <p className="m-0">{m.width_guide_sidewalk_split()}</p>
      <p className="m-0 text-[11px] text-zinc-500">
        <WikiLink href="https://wiki.openstreetmap.org/wiki/Sidewalks">
          {m.width_guide_link_sidewalks()}
        </WikiLink>
        {' · '}
        <WikiLink href="https://wiki.openstreetmap.org/wiki/Key:width">
          {m.width_guide_link_key_width()}
        </WikiLink>
      </p>
    </div>
  )
}

function CyclewayGuide() {
  return (
    <div className="flex flex-col gap-2.5 text-xs leading-relaxed text-zinc-700">
      <p className="m-0">{m.width_guide_cycleway_clear()}</p>
      <p className="m-0">
        {m.width_guide_cycleway_buffer_before()}{' '}
        <WikiLink href="https://wiki.openstreetmap.org/wiki/Key:cycleway:buffer">
          {m.width_guide_link_buffer()}
        </WikiLink>
        {m.width_guide_cycleway_buffer_after()}
      </p>
      <GuideImage
        src={widthBufferIncludesPaintGraphic()}
        alt={m.width_guide_cycleway_diagram_alt()}
        caption={m.width_guide_cycleway_diagram_caption()}
      />
      <p className="m-0 text-[11px] text-zinc-500">
        <WikiLink href="https://wiki.openstreetmap.org/wiki/Berlin/Verkehrswende/Radwege">
          {m.width_guide_link_berlin_cycleways()}
        </WikiLink>
        {' · '}
        <WikiLink href="https://wiki.openstreetmap.org/wiki/Key:cycleway:buffer">
          {m.width_guide_link_buffer()}
        </WikiLink>
      </p>
    </div>
  )
}

function OtherGuide() {
  return (
    <div className="flex flex-col gap-2.5 text-xs leading-relaxed text-zinc-700">
      <p className="m-0">{m.width_guide_other_surface()}</p>
      <p className="m-0">{m.width_guide_other_split()}</p>
      <p className="m-0 text-[11px] text-zinc-500">
        <WikiLink href="https://wiki.openstreetmap.org/wiki/Key:width">
          {m.width_guide_link_key_width()}
        </WikiLink>
      </p>
    </div>
  )
}

const TITLE_BY_KIND = {
  road: () => m.width_guide_title_road(),
  sidewalk: () => m.width_guide_title_sidewalk(),
  cycleway: () => m.width_guide_title_cycleway(),
  other: () => m.width_guide_title_other(),
} as const satisfies Record<WidthMeasureGuideKind, () => string>

function GuideBody({ kind }: { kind: WidthMeasureGuideKind }) {
  switch (kind) {
    case 'road':
      return <RoadGuide />
    case 'sidewalk':
      return <SidewalkGuide />
    case 'cycleway':
      return <CyclewayGuide />
    case 'other':
      return <OtherGuide />
  }
}

export function WidthMeasureGuide(props: { prefix?: SidepathPrefix; tags: OsmTags }) {
  const kind = widthMeasureGuideKind(props)

  return (
    <section
      aria-label={m.width_guide_section_label()}
      className="overflow-hidden rounded-sm ring-1 ring-zinc-950/5"
    >
      <div className="flex items-center justify-between gap-2 bg-zinc-700 px-2 py-1 text-xs font-semibold tracking-wide text-white uppercase">
        <span>{TITLE_BY_KIND[kind]()}</span>
        <Badge color="amber" className="uppercase tracking-wide">
          {m.shell_maturity_alpha()}
        </Badge>
      </div>
      <div className="bg-zinc-50 px-2 py-2.5">
        <GuideBody kind={kind} />
      </div>
    </section>
  )
}
