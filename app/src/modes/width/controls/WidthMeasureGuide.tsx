import * as m from '@app/paraglide/messages'
import type { OsmTags } from '@osm-editor-kit/osm-data'
import type { SidepathPrefix } from '@osm-editor-kit/osm-sidepath-tags'
import { Badge } from '../../../components/catalyst/badge'
import {
  widthMeasureGuideKind,
  type WidthMeasureGuideKind,
} from '../domain/width-measure-guide-kind'
import { guideMessage, SectionWikiLinks } from '../measure-guide/presentation'
import { SECTION_BODIES } from '../measure-guide/section-bodies'
import { expandedSectionId, sectionsForPanel } from '../measure-guide/sections'

const TITLE_BY_KIND = {
  road: () => m.width_guide_title_road(),
  sidewalk: () => m.width_guide_title_sidewalk(),
  cycleway: () => m.width_guide_title_cycleway(),
  other: () => m.width_guide_title_other(),
} as const satisfies Record<WidthMeasureGuideKind, () => string>

export function WidthMeasureGuide(props: { prefix?: SidepathPrefix; tags: OsmTags }) {
  const kind = widthMeasureGuideKind(props)
  const sections = sectionsForPanel(kind, props.tags)
  const expandedId = expandedSectionId(sections)

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
      <div className="flex flex-col gap-2 bg-zinc-50 px-2 py-2.5">
        {sections.map((section) => {
          const Body = SECTION_BODIES[section.id]
          const title = guideMessage(section.messages.title)
          const isExpanded = section.id === expandedId

          if (isExpanded) {
            return (
              <div key={section.id} className="flex flex-col gap-1.5">
                <h3 className="m-0 text-[11px] font-semibold tracking-wide text-zinc-600 uppercase">
                  {title}
                </h3>
                <Body density="panel" />
                <SectionWikiLinks links={section.links} />
              </div>
            )
          }

          return (
            <details key={section.id} className="group">
              <summary className="cursor-pointer list-none text-[11px] font-semibold tracking-wide text-zinc-600 uppercase marker:content-none [&::-webkit-details-marker]:hidden">
                <span className="inline-flex items-center gap-1">
                  <span
                    aria-hidden
                    className="inline-block text-zinc-400 transition-transform group-open:rotate-90"
                  >
                    ▸
                  </span>
                  {title}
                </span>
              </summary>
              <div className="mt-1.5 flex flex-col gap-1.5">
                <Body density="panel" />
                <SectionWikiLinks links={section.links} />
              </div>
            </details>
          )
        })}
      </div>
    </section>
  )
}
