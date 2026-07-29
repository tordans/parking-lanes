import * as m from '@app/paraglide/messages'
import { getLocale, setLocale } from '@app/paraglide/runtime'
import { useNavigate } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { DEFAULT_UI_LOCALE, isUiLocale, uiLocales, type UiLocale } from '../../../i18n/uiLocale'
import {
  widthBufferIncludesPaintGraphic,
  wikiParkingLaneGraphic,
  wikiParkingStreetSideGraphic,
  wikiWidthCarriagewayGraphic,
} from '../domain/width-graphics'
import { CrossSectionFigure } from './CrossSectionFigure'
import { callGuideMessage, MeasureGuideLocaleProvider } from './measure-guide-locale'
import { guideMessage, ResearchDeepLinks, SectionWikiLinks, WikiLink } from './presentation'
import { SECTION_BODIES } from './section-bodies'
import { measureGuideSections, type MeasureGuideGroup, type MeasureGuideSection } from './sections'
import {
  cyclewayBufferSpec,
  roadKerbSpec,
  roadParkingLaneSpec,
  roadParkingStreetSideSpec,
} from './specs'

const GROUP_ORDER: readonly MeasureGuideGroup[] = ['carriageway', 'cycle', 'sidepath', 'values']

const GROUP_LABEL: Record<MeasureGuideGroup, string> = {
  carriageway: 'Carriageway',
  cycle: 'Cycle',
  sidepath: 'Sidepaths and pedestrian space',
  values: 'Values and provenance',
}

const LOCALE_LABEL = {
  de: m.shell_lang_de,
  en: m.shell_lang_en,
} as const

function syncParaglideLocale(locale: UiLocale) {
  if (getLocale() !== locale) {
    setLocale(locale, { reload: false })
  }
}

/** URL `locale` overrides; without it, keep the user's current paraglide locale. */
function resolveAuditLocale(urlLocale: UiLocale | undefined): UiLocale {
  if (urlLocale != null) return urlLocale
  const current = getLocale()
  return isUiLocale(current) ? current : DEFAULT_UI_LOCALE
}

function sectionsForAudit(): MeasureGuideSection[] {
  return measureGuideSections.filter(
    (section) => section.audience === 'panel+audit' || section.audience === 'audit',
  )
}

function sectionsByGroup(
  sections: readonly MeasureGuideSection[],
): { group: MeasureGuideGroup; sections: MeasureGuideSection[] }[] {
  return GROUP_ORDER.map((group) => ({
    group,
    sections: sections.filter((s) => s.group === group),
  })).filter((entry) => entry.sections.length > 0)
}

function SourceCompare(props: {
  svg: ReactNode
  imageSrc: string
  imageAlt: string
  citation: ReactNode
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="min-w-0">{props.svg}</div>
      <figure className="m-0 flex min-w-0 flex-col gap-2">
        <img
          src={props.imageSrc}
          alt={props.imageAlt}
          className="w-full rounded-sm border border-zinc-200 bg-white object-contain"
        />
        <figcaption className="text-xs leading-relaxed text-zinc-600">{props.citation}</figcaption>
      </figure>
    </div>
  )
}

function Note({ children }: { children: ReactNode }) {
  return <p className="m-0 text-xs text-zinc-500">{children}</p>
}

function AuditSection({ section, locale }: { section: MeasureGuideSection; locale: UiLocale }) {
  const Body = SECTION_BODIES[section.id]
  const title = guideMessage(section.messages.title, locale)

  return (
    <article
      id={section.id}
      className="scroll-mt-6 border-t border-zinc-200 pt-8 first:border-t-0 first:pt-0"
    >
      <header className="mb-3 flex flex-col gap-1">
        <h3 className="m-0 text-lg font-semibold text-zinc-900">{title}</h3>
        <p className="m-0 text-sm text-zinc-600">
          Research: <ResearchDeepLinks research={section.research} />
          {' · '}
          Editor writes:{' '}
          <code className="font-mono text-[0.9em] text-zinc-800">{section.editorWrites}</code>
        </p>
      </header>

      {section.id === 'road_kerb' ? (
        <div className="flex flex-col gap-3 text-sm leading-relaxed text-zinc-700">
          <p className="m-0">{callGuideMessage(m.width_guide_road_kerb_body, locale)}</p>
          <SourceCompare
            svg={
              <CrossSectionFigure
                spec={roadKerbSpec}
                density="audit"
                title={callGuideMessage(m.width_guide_road_kerb_title, locale)}
              />
            }
            imageSrc={wikiWidthCarriagewayGraphic()}
            imageAlt="OSM Wiki carriageway width diagram (kerb to kerb)"
            citation={
              <>
                Source:{' '}
                <WikiLink href="https://wiki.openstreetmap.org/wiki/File:Width-carriageway.png">
                  File:Width-carriageway.png
                </WikiLink>{' '}
                on the OpenStreetMap Wiki ·{' '}
                <WikiLink href="https://creativecommons.org/licenses/by-sa/2.0/">CC BY-SA</WikiLink>
              </>
            }
          />
          <Note>{callGuideMessage(m.width_guide_road_kerb_note, locale)}</Note>
        </div>
      ) : section.id === 'road_parking_branch' ? (
        <div className="flex flex-col gap-3 text-sm leading-relaxed text-zinc-700">
          <p className="m-0">{callGuideMessage(m.width_guide_road_parking_branch_body, locale)}</p>
          <div className="grid gap-6 lg:grid-cols-2">
            <SourceCompare
              svg={
                <CrossSectionFigure
                  spec={roadParkingLaneSpec}
                  density="audit"
                  title={callGuideMessage(m.width_guide_road_parking_branch_title, locale)}
                  ariaLabel="parking:*=lane"
                />
              }
              imageSrc={wikiParkingLaneGraphic()}
              imageAlt="OSM Wiki: parking position lane (on carriageway)"
              citation={
                <>
                  Source:{' '}
                  <WikiLink href="https://wiki.openstreetmap.org/wiki/File:Parking_position_lane.png">
                    File:Parking_position_lane.png
                  </WikiLink>{' '}
                  on the OpenStreetMap Wiki ·{' '}
                  <WikiLink href="https://creativecommons.org/licenses/by-sa/2.0/">
                    CC BY-SA
                  </WikiLink>
                </>
              }
            />
            <SourceCompare
              svg={
                <CrossSectionFigure
                  spec={roadParkingStreetSideSpec}
                  density="audit"
                  title={callGuideMessage(m.width_guide_road_parking_branch_title, locale)}
                  ariaLabel="parking:*=street_side"
                />
              }
              imageSrc={wikiParkingStreetSideGraphic()}
              imageAlt="OSM Wiki: parking position street_side (off carriageway)"
              citation={
                <>
                  Source:{' '}
                  <WikiLink href="https://wiki.openstreetmap.org/wiki/File:Parking_position_street_side.png">
                    File:Parking_position_street_side.png
                  </WikiLink>{' '}
                  on the OpenStreetMap Wiki ·{' '}
                  <WikiLink href="https://creativecommons.org/licenses/by-sa/2.0/">
                    CC BY-SA
                  </WikiLink>
                </>
              }
            />
          </div>
        </div>
      ) : section.id === 'cycleway_buffer' ? (
        <div className="flex flex-col gap-3 text-sm leading-relaxed text-zinc-700">
          <p className="m-0">{callGuideMessage(m.width_guide_cycleway_buffer_body, locale)}</p>
          <SourceCompare
            svg={
              <CrossSectionFigure
                spec={cyclewayBufferSpec}
                density="audit"
                title={callGuideMessage(m.width_guide_cycleway_buffer_title, locale)}
              />
            }
            imageSrc={widthBufferIncludesPaintGraphic()}
            imageAlt="ERA design drawing: buffer package including paint strokes"
            citation={
              <>
                Source: German ERA-style design drawing — buffer metres include boundary paint and
                hatching (Berlin / Verkehrswende practice). See{' '}
                <WikiLink href="https://wiki.openstreetmap.org/wiki/Berlin/Verkehrswende/Radwege">
                  Berlin/Verkehrswende/Radwege
                </WikiLink>{' '}
                and{' '}
                <WikiLink href="https://wiki.openstreetmap.org/wiki/Key:cycleway:buffer">
                  Key:cycleway:buffer
                </WikiLink>
                .
              </>
            }
          />
        </div>
      ) : (
        <Body density="audit" />
      )}

      <div className="mt-3">
        <SectionWikiLinks links={section.links} />
      </div>
    </article>
  )
}

export type WidthAuditPageProps = {
  locale: UiLocale | undefined
}

export function WidthAuditPage(props: WidthAuditPageProps) {
  const navigate = useNavigate({ from: '/audit-width' })
  // Without `?locale=`, keep the user's current paraglide locale (do not force English).
  const uiLocale = resolveAuditLocale(props.locale)
  syncParaglideLocale(uiLocale)

  const sections = sectionsForAudit()
  const grouped = sectionsByGroup(sections)

  function setUiLocale(next: UiLocale) {
    if (!isUiLocale(next)) return
    syncParaglideLocale(next)
    // Always write locale into the URL so the toggle re-renders section copy without a reload.
    void navigate({
      search: (prev) => ({
        ...prev,
        locale: next,
      }),
      replace: true,
    })
  }

  // Key the localized subtree on the resolved locale so it remounts after
  // setLocale({ reload: false }). Explicit `{ locale }` on message calls covers
  // the same remount; together they stay in sync with the rest of the app.
  // Map routes lock body/#root to the viewport height (main.scss + AppShell).
  // This page is not the map shell — scroll inside #root as a normal document.
  return (
    <div className="h-full overflow-y-auto overscroll-contain bg-zinc-50 text-zinc-900">
      <MeasureGuideLocaleProvider locale={uiLocale}>
        <div key={uiLocale} className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <header className="mb-10 flex flex-col gap-4 border-b border-zinc-200 pb-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="m-0 text-sm font-medium tracking-wide text-zinc-500 uppercase">
                  Street Space Editor · Audit
                </p>
                <h1 className="mt-1 mb-0 text-2xl font-semibold tracking-tight sm:text-3xl">
                  Width — measure rules and tag relations
                </h1>
                <p className="mt-2 mb-0 max-w-3xl text-sm leading-relaxed text-zinc-600">
                  How this app understands OSM width tags: diagrams, UI copy, and what the width
                  editor can write. Each section ends with wiki, forum, and related sources — you
                  should not need the research folder for primary references. Research § links
                  remain for the deep dive.
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div
                  role="group"
                  aria-label={callGuideMessage(m.shell_language_title, uiLocale)}
                  className="flex items-center gap-2 text-sm"
                >
                  {uiLocales.map((locale) => (
                    <button
                      key={locale}
                      type="button"
                      onClick={() => setUiLocale(locale)}
                      className={
                        locale === uiLocale
                          ? 'rounded-sm bg-zinc-800 px-2.5 py-1 font-medium text-white'
                          : 'rounded-sm px-2.5 py-1 text-zinc-600 ring-1 ring-zinc-300 hover:bg-zinc-100'
                      }
                    >
                      {callGuideMessage(LOCALE_LABEL[locale], uiLocale)}
                    </button>
                  ))}
                </div>
                {/* Sibling link to /audit-lanes should be added when that route ships.
                    Linking it now would fall through to /$mode and render the parking map. */}
              </div>
            </div>
          </header>

          <nav aria-label="Sections" className="mb-12">
            <h2 className="m-0 mb-3 text-sm font-semibold tracking-wide text-zinc-500 uppercase">
              Contents
            </h2>
            <ol className="m-0 grid list-decimal gap-x-8 gap-y-4 pl-5 sm:grid-cols-2">
              {grouped.map(({ group, sections: groupSections }) => (
                <li key={group} className="min-w-0">
                  <p className="m-0 mb-1 font-medium text-zinc-800">{GROUP_LABEL[group]}</p>
                  <ul className="m-0 list-none space-y-1 pl-0 text-sm">
                    {groupSections.map((section) => (
                      <li key={section.id}>
                        <a href={`#${section.id}`} className="text-blue-700 hover:underline">
                          {guideMessage(section.messages.title, uiLocale)}
                        </a>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          </nav>

          <div className="flex flex-col gap-12">
            {grouped.map(({ group, sections: groupSections }) => (
              <section key={group} aria-labelledby={`group-${group}`}>
                <h2
                  id={`group-${group}`}
                  className="m-0 mb-6 text-xl font-semibold tracking-tight text-zinc-900"
                >
                  {GROUP_LABEL[group]}
                </h2>
                <div className="flex flex-col gap-10">
                  {groupSections.map((section) => (
                    <AuditSection key={section.id} section={section} locale={uiLocale} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </MeasureGuideLocaleProvider>
    </div>
  )
}
