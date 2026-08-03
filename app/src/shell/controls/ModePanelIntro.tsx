import * as m from '@app/paraglide/messages'
import { serializeFeatureParam, type OsmFeatureRef } from '@osm-editor-kit/osm-map-url'
import clsx from 'clsx'
import type { ReactNode } from 'react'
import { highwayCategoryLabel } from '../../i18n/highway-labels'

type SidepathRef = Pick<OsmFeatureRef, 'prefix' | 'side'> & {
  prefix: 'cycleway' | 'sidewalk'
  side: 'left' | 'right'
}

function sidepathKindLabel(prefix: SidepathRef['prefix']): string {
  return prefix === 'sidewalk' ? m.panel_sidepath_sidewalk() : m.panel_sidepath_cycleway()
}

function sidepathSideLabel(side: SidepathRef['side']): string {
  return side === 'left' ? m.panel_sidepath_side_left() : m.panel_sidepath_side_right()
}

function categoryLabelFor(highway: string | undefined, sidepath?: SidepathRef): string {
  const highwayLabel = highwayCategoryLabel(highway) ?? m.panel_way_fallback()
  if (!sidepath) return highwayLabel

  return m.panel_sidepath_of_highway({
    kind: sidepathKindLabel(sidepath.prefix),
    side: sidepathSideLabel(sidepath.side),
    highway: highwayLabel,
  })
}

export function ModePanelIntro(props: {
  wayId: number
  highway?: string
  /** OSM `name` — shown after the category when the intro container is wide enough. */
  streetName?: string
  /** Sidepath selection derived from a centerline way (`cycleway`/`sidewalk` + side). */
  sidepath?: SidepathRef
  leading?: ReactNode
  trailing?: ReactNode
  className?: string
  /** Place the way identity on the left (surface mode). Default keeps it right-aligned. */
  identityStart?: boolean
}) {
  const categoryLabel = categoryLabelFor(props.highway, props.sidepath)
  const streetName = props.streetName?.trim() || undefined
  const idLine = serializeFeatureParam({
    type: 'way',
    id: props.wayId,
    prefix: props.sidepath?.prefix,
    side: props.sidepath?.side,
  })
  const identityOnStart = props.identityStart === true

  return (
    <div
      className={clsx('@container/mode-intro', props.className ?? 'mb-1.5 flex items-center gap-2')}
    >
      {props.leading}
      <div
        className={
          identityOnStart
            ? 'flex min-w-0 flex-1 items-center gap-2'
            : 'ml-auto flex min-w-0 shrink-0 items-center gap-2'
        }
      >
        <div
          className={
            identityOnStart
              ? 'min-w-0 text-left text-xs leading-tight text-zinc-700'
              : 'min-w-0 text-right text-xs leading-tight text-zinc-700'
          }
        >
          <div className="truncate font-medium text-zinc-900">
            {categoryLabel}
            {streetName ? (
              <span className="hidden @[12rem]/mode-intro:inline"> &ldquo;{streetName}&rdquo;</span>
            ) : null}
          </div>
          <div className="font-mono text-[11px] text-zinc-500">{idLine}</div>
        </div>
        {props.trailing}
      </div>
    </div>
  )
}
