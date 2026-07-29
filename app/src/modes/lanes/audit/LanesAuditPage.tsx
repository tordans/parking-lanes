import type { RoadSpaceScene, RoadSpaceSegmentRole } from '@osm-editor-kit/osm-lane-diagram'
import { laneDiagramFixtures, type DiagramFixture } from '@osm-editor-kit/osm-lane-diagram/fixtures'
import { Link } from '@tanstack/react-router'
import { useState, type ReactElement, type ReactNode } from 'react'
import { APP_REPO_URL } from '../../../lib/app-identity'
import {
  RoadSpaceDiagram,
  ROAD_SPACE_KIND_SWATCH,
  ROAD_SPACE_MEDIAN_SWATCH,
  ROAD_SPACE_SIBLING_SWATCH,
  separatelyMappedNotesEn,
} from '../components/RoadSpaceDiagram'
import {
  formatTagLines,
  parseTagLines,
  sceneFromSegmentTags,
  type SegmentTagsInput,
} from './build-scene'

type FixtureGroupId = 'basic' | 'transitions' | 'islands' | 'bike' | 'width'

const FIXTURE_GROUPS: readonly {
  id: FixtureGroupId
  label: string
  fixtureIds: readonly string[]
}[] = [
  {
    id: 'basic',
    label: 'Basic',
    fixtureIds: ['one-lane-each-way', 'two-lane-each-way'],
  },
  {
    id: 'transitions',
    label: 'Transitions & pockets',
    fixtureIds: ['right-turn-pocket', 'turn-pocket-then-continue', 'placement-transition'],
  },
  {
    id: 'islands',
    label: 'Islands & junctions',
    fixtureIds: ['dual-carriageway-island', 't-junction', 'cross-junction'],
  },
  {
    id: 'bike',
    label: 'Bike & sidepaths',
    fixtureIds: [
      'mid-road-cycle-lane',
      'oneway-sidewalks-cycle',
      'shared-sidepath-segregated',
      'shared-sidepath-not-segregated',
      'contraflow-cycling',
      'no-sidewalk-tagged',
      'sidewalk-no-and-separate',
      'reversed-neighbour',
    ],
  },
  {
    id: 'width',
    label: 'Width reconciliation',
    fixtureIds: ['width-vs-width-lanes', 'parking-bike-buffer', 'unmarked-carriageway'],
  },
]

const ROLE_ORDER: readonly RoadSpaceSegmentRole[] = ['prev', 'current', 'next']

const ROLE_LABEL: Record<RoadSpaceSegmentRole, string> = {
  prev: 'Previous',
  current: 'Current',
  next: 'Next',
}

const DEFAULT_SANDBOX_CURRENT = `highway=residential
lanes=2
sidewalk=both
name=Sandboxstraße`

const LANE_RENDERING_RESEARCH_URL = `${APP_REPO_URL}/blob/main/research/lane-rendering/README.md`
const WIDTH_MEASUREMENTS_RESEARCH_URL = `${APP_REPO_URL}/blob/main/research/width-measurements/README.md`

function fixtureById(id: string): DiagramFixture {
  const fixture = laneDiagramFixtures.find((f) => f.id === id)
  if (!fixture) throw new Error(`Missing lane diagram fixture: ${id}`)
  return fixture
}

function sceneForFixture(fixture: DiagramFixture): RoadSpaceScene {
  return sceneFromSegmentTags(fixture.segments)
}

function ariaLabelForFixture(fixture: DiagramFixture): string {
  const roles = fixture.segments.map((s) => s.role).join(', ')
  return `${fixture.title}: plan sketch for ${roles || 'current'} segment(s)`
}

function TagList({ tags }: { tags: Record<string, string> }): ReactElement {
  const entries = Object.entries(tags).sort(([a], [b]) => a.localeCompare(b))
  if (entries.length === 0) {
    return <p className="m-0 text-xs text-zinc-500">(no tags)</p>
  }
  return (
    <ul className="m-0 list-none space-y-0.5 pl-0 font-mono text-xs leading-relaxed text-zinc-800">
      {entries.map(([key, value]) => (
        <li key={key}>
          {key}={value}
        </li>
      ))}
    </ul>
  )
}

function SegmentTags({ fixture }: { fixture: DiagramFixture }): ReactElement {
  const byRole = new Map(fixture.segments.map((s) => [s.role, s] as const))
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {ROLE_ORDER.map((role) => {
        const seg = byRole.get(role)
        return (
          <div key={role} className="min-w-0">
            <p className="m-0 mb-1 text-xs font-semibold tracking-wide text-zinc-500 uppercase">
              {ROLE_LABEL[role]}
              {seg ? ` · way ${seg.wayId}` : ''}
            </p>
            {seg ? <TagList tags={seg.tags} /> : <p className="m-0 text-xs text-zinc-400">—</p>}
          </div>
        )
      })}
    </div>
  )
}

function FixtureArticle({ fixture }: { fixture: DiagramFixture }): ReactElement {
  const scene = sceneForFixture(fixture)
  const separateNotes = separatelyMappedNotesEn(scene.separatelyMapped)
  return (
    <article
      id={fixture.id}
      className="scroll-mt-6 border-t border-zinc-200 pt-8 first:border-t-0 first:pt-0"
    >
      <header className="mb-3 flex flex-col gap-1">
        <h3 className="m-0 text-lg font-semibold text-zinc-900">{fixture.title}</h3>
        <p className="m-0 text-sm text-zinc-600">{fixture.description}</p>
      </header>
      <div className="mb-4 overflow-x-auto rounded-sm border border-zinc-200 bg-white p-3">
        <RoadSpaceDiagram scene={scene} ariaLabel={ariaLabelForFixture(fixture)} />
        {separateNotes.length > 0 ? (
          <ul className="mt-2 mb-0 list-none space-y-0.5 pl-0 text-xs leading-snug text-zinc-500">
            {separateNotes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        ) : null}
      </div>
      <SegmentTags fixture={fixture} />
      {fixture.note ? <p className="mt-3 mb-0 text-xs text-zinc-500">{fixture.note}</p> : null}
    </article>
  )
}

function Legend(): ReactElement {
  const swatches: { label: string; color: string }[] = [
    { label: 'Motor (carriageway)', color: ROAD_SPACE_KIND_SWATCH.motor },
    { label: 'Bus', color: ROAD_SPACE_KIND_SWATCH.bus },
    { label: 'Cycle', color: ROAD_SPACE_KIND_SWATCH.cycle },
    { label: 'Both-ways', color: ROAD_SPACE_KIND_SWATCH.both_ways },
    { label: 'Sidewalk', color: ROAD_SPACE_KIND_SWATCH.sidewalk },
    { label: 'Shared path', color: ROAD_SPACE_KIND_SWATCH.shared_path },
    { label: 'Median island', color: ROAD_SPACE_MEDIAN_SWATCH },
    { label: 'Opposite carriageway', color: ROAD_SPACE_SIBLING_SWATCH },
  ]
  return (
    <section aria-labelledby="legend-heading" className="mb-12 border-b border-zinc-200 pb-8">
      <h2
        id="legend-heading"
        className="m-0 mb-3 text-sm font-semibold tracking-wide text-zinc-500 uppercase"
      >
        Legend
      </h2>
      <p className="mt-0 mb-3 max-w-3xl text-sm leading-relaxed text-zinc-600">
        ↑ = OSM way direction points <strong className="font-semibold text-zinc-800">up</strong> the
        page, so diagram-left = <code className="font-mono text-[0.9em]">*:left</code> and
        diagram-right = <code className="font-mono text-[0.9em]">*:right</code> (same convention as
        the width audit). Forward travel draws ↑; backward draws ↓; both-ways is a double-headed
        vertical glyph.
      </p>
      <ul className="m-0 mb-3 flex list-none flex-wrap gap-3 pl-0 text-sm text-zinc-700">
        {swatches.map((s) => (
          <li key={s.label} className="flex items-center gap-2">
            <span
              className="inline-block size-3.5 rounded-sm border border-zinc-300"
              style={{ backgroundColor: s.color }}
              aria-hidden
            />
            {s.label}
          </li>
        ))}
      </ul>
      <ul className="m-0 list-disc space-y-1 pl-5 text-sm leading-relaxed text-zinc-600">
        <li>Previous / next bands are dimmed relative to the current segment.</li>
        <li>
          Tagged widths show a small metre label inside the slot. Untagged (default) widths use a
          slightly desaturated fill and <strong>dotted vertical edges only</strong> — no full
          rectangle outline — so the sketch still reads as a plan, not a construction drawing.
        </li>
        <li>
          Kerbs are heavy strokes between sidewalk and carriageway; outer sidepath edges are
          lighter; dashed hairlines mark segment boundaries and unmarked separators. Dual
          carriageways draw an explicit median island with kerbs on both faces; the sibling
          placeholder is labelled “Opposite carriageway”.
        </li>
        <li>
          <code className="font-mono text-[0.9em]">sidewalk:*=separate</code> /{' '}
          <code className="font-mono text-[0.9em]">cycleway:*=separate</code> do not draw slots —
          they appear as a short note under the diagram.{' '}
          <code className="font-mono text-[0.9em]">no</code> /{' '}
          <code className="font-mono text-[0.9em]">none</code> produce no geometry at all.
        </li>
        <li>
          Arrows hint travel direction (forward = up); turn glyphs come from{' '}
          <code className="font-mono text-[0.9em]">turn:lanes</code>.
        </li>
        <li>
          Diagrams render at their natural pixel size (scene widthPx × heightPx) and shrink with{' '}
          <code className="font-mono text-[0.9em]">max-width: 100%</code> — they never stretch
          beyond 1:1.
        </li>
      </ul>
    </section>
  )
}

function SandboxSection(): ReactElement {
  const [prevText, setPrevText] = useState('')
  const [currentText, setCurrentText] = useState(DEFAULT_SANDBOX_CURRENT)
  const [nextText, setNextText] = useState('')

  const segments: SegmentTagsInput[] = []
  const prevTags = parseTagLines(prevText)
  const currentTags = parseTagLines(currentText)
  const nextTags = parseTagLines(nextText)
  if (Object.keys(prevTags).length > 0) {
    segments.push({ role: 'prev', wayId: 9001, tags: prevTags })
  }
  if (Object.keys(currentTags).length > 0) {
    segments.push({ role: 'current', wayId: 9002, tags: currentTags })
  }
  if (Object.keys(nextTags).length > 0) {
    segments.push({ role: 'next', wayId: 9003, tags: nextTags })
  }

  let scene: RoadSpaceScene | null = null
  let error: string | null = null
  if (segments.length === 0) {
    error = 'Enter at least one key=value line for the current segment.'
  } else {
    try {
      scene = sceneFromSegmentTags(segments)
    } catch (e) {
      error = e instanceof Error ? e.message : String(e)
    }
  }

  const separateNotes = separatelyMappedNotesEn(scene?.separatelyMapped)

  return (
    <section
      id="sandbox"
      aria-labelledby="sandbox-heading"
      className="border-t border-zinc-200 pt-10"
    >
      <h2
        id="sandbox-heading"
        className="m-0 mb-2 text-xl font-semibold tracking-tight text-zinc-900"
      >
        Sandbox
      </h2>
      <p className="mt-0 mb-4 max-w-3xl text-sm leading-relaxed text-zinc-600">
        Type raw <code className="font-mono text-[0.9em]">key=value</code> lines for prev / current
        / next. Tags are assumed already oriented to the current way direction. The diagram updates
        live; open the details block for the layout scene JSON.
      </p>
      <div className="mb-4 grid gap-4 lg:grid-cols-3">
        {(
          [
            ['prev', prevText, setPrevText, 'Previous (optional)'],
            ['current', currentText, setCurrentText, 'Current'],
            ['next', nextText, setNextText, 'Next (optional)'],
          ] as const
        ).map(([role, value, setValue, label]) => (
          <label key={role} className="flex min-w-0 flex-col gap-1.5 text-sm">
            <span className="font-medium text-zinc-800">{label}</span>
            <textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              spellCheck={false}
              rows={10}
              className="resize-y rounded-sm border border-zinc-300 bg-white p-2 font-mono text-xs leading-relaxed text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder={
                role === 'current' ? formatTagLines({ highway: 'residential', lanes: '2' }) : ''
              }
            />
          </label>
        ))}
      </div>
      {error ? (
        <p className="m-0 text-sm text-amber-800">{error}</p>
      ) : scene ? (
        <>
          <div className="mb-4 overflow-x-auto rounded-sm border border-zinc-200 bg-white p-3">
            <RoadSpaceDiagram scene={scene} ariaLabel="Sandbox plan sketch from edited tags" />
            {separateNotes.length > 0 ? (
              <ul className="mt-2 mb-0 list-none space-y-0.5 pl-0 text-xs leading-snug text-zinc-500">
                {separateNotes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            ) : null}
          </div>
          <details className="rounded-sm border border-zinc-200 bg-zinc-50 p-3 text-sm">
            <summary className="cursor-pointer font-medium text-zinc-800">Scene JSON</summary>
            <pre className="mt-3 mb-0 overflow-x-auto text-xs leading-relaxed text-zinc-700">
              {JSON.stringify(scene, null, 2)}
            </pre>
          </details>
        </>
      ) : null}
    </section>
  )
}

function Note({ children }: { children: ReactNode }) {
  return <p className="m-0 text-xs text-zinc-500">{children}</p>
}

export function LanesAuditPage(): ReactElement {
  const grouped = FIXTURE_GROUPS.map((group) => ({
    ...group,
    fixtures: group.fixtureIds.map(fixtureById),
  }))

  return (
    <div className="h-full overflow-y-auto overscroll-contain bg-zinc-50 text-zinc-900">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-10 flex flex-col gap-4 border-b border-zinc-200 pb-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="m-0 text-sm font-medium tracking-wide text-zinc-500 uppercase">
                Street Space Editor · Audit
              </p>
              <h1 className="mt-1 mb-0 text-2xl font-semibold tracking-tight sm:text-3xl">
                Lanes — cross-section interpretation
              </h1>
              <p className="mt-2 mb-0 max-w-3xl text-sm leading-relaxed text-zinc-600">
                How this app interprets OSM lane and sidepath tags into a Level-B plan sketch (prev
                / current / next). OSM way direction points <strong>up</strong> the page
                (diagram-left = <code className="font-mono text-[0.9em]">*:left</code>
                ). This is not a measure guide — for width clear-vs-inclusive rules and teaching
                figures, see the sibling width audit. Reasoning lives in{' '}
                <a
                  href={LANE_RENDERING_RESEARCH_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-700 hover:underline"
                >
                  research/lane-rendering
                </a>{' '}
                and{' '}
                <a
                  href={WIDTH_MEASUREMENTS_RESEARCH_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-700 hover:underline"
                >
                  research/width-measurements
                </a>
                .
              </p>
            </div>
            <div className="flex flex-col items-end gap-2 text-sm">
              <Link to="/audit-width" className="text-blue-700 hover:underline">
                Width — measure rules →
              </Link>
              <Link
                to="/$mode"
                params={{ mode: 'lanes' }}
                className="text-blue-700 hover:underline"
              >
                ← Open lanes mode
              </Link>
            </div>
          </div>
        </header>

        <Legend />

        <nav aria-label="Sections" className="mb-12">
          <h2 className="m-0 mb-3 text-sm font-semibold tracking-wide text-zinc-500 uppercase">
            Contents
          </h2>
          <ol className="m-0 grid list-decimal gap-x-8 gap-y-4 pl-5 sm:grid-cols-2">
            {grouped.map((group) => (
              <li key={group.id} className="min-w-0">
                <p className="m-0 mb-1 font-medium text-zinc-800">{group.label}</p>
                <ul className="m-0 list-none space-y-1 pl-0 text-sm">
                  {group.fixtures.map((fixture) => (
                    <li key={fixture.id}>
                      <a href={`#${fixture.id}`} className="text-blue-700 hover:underline">
                        {fixture.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
            <li className="min-w-0">
              <p className="m-0 mb-1 font-medium text-zinc-800">Sandbox</p>
              <ul className="m-0 list-none space-y-1 pl-0 text-sm">
                <li>
                  <a href="#sandbox" className="text-blue-700 hover:underline">
                    Live tag editor
                  </a>
                </li>
              </ul>
            </li>
          </ol>
        </nav>

        <div className="flex flex-col gap-12">
          {grouped.map((group) => (
            <section key={group.id} aria-labelledby={`group-${group.id}`}>
              <h2
                id={`group-${group.id}`}
                className="m-0 mb-6 text-xl font-semibold tracking-tight text-zinc-900"
              >
                {group.label}
              </h2>
              <div className="flex flex-col gap-10">
                {group.fixtures.map((fixture) => (
                  <FixtureArticle key={fixture.id} fixture={fixture} />
                ))}
              </div>
            </section>
          ))}
        </div>

        <SandboxSection />

        <footer className="mt-12 border-t border-zinc-200 pt-6">
          <Note>
            Fixtures live in{' '}
            <code className="font-mono text-[0.9em]">
              @osm-editor-kit/osm-lane-diagram/fixtures
            </code>{' '}
            and are shared with package snapshot tests. English only — this is a developer audit
            page, not mode chrome.
          </Note>
        </footer>
      </div>
    </div>
  )
}
