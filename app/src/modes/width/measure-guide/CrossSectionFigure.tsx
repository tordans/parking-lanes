import * as m from '@app/paraglide/messages'
import { CrossSection } from './cross-section/CrossSection'
import { crossSectionLayout } from './cross-section/layout'
import type { CrossSectionDensity, CrossSectionSpec } from './cross-section/types'
import { callGuideMessage, useMeasureGuideLocale } from './measure-guide-locale'

type Props = {
  spec: CrossSectionSpec
  density?: CrossSectionDensity
  title: string
  ariaLabel?: string
  className?: string
}

/** HTML caption repeating SVG dimension labels (a11y — metres not trapped in SVG). */
export function dimensionCaption(spec: CrossSectionSpec, density: CrossSectionDensity): string {
  const layout = crossSectionLayout(spec, density)
  return layout.dimensions.map((dim) => dim.labelText).join(' · ')
}

/**
 * Cross-section SVG plus HTML captions driven by the spec:
 * computed metres (a11y), assumption legend, edge-attachment rules, illustrative disclaimer.
 */
export function CrossSectionFigure({
  spec,
  density = 'panel',
  title,
  ariaLabel,
  className,
}: Props) {
  const locale = useMeasureGuideLocale()
  const layout = crossSectionLayout(spec, density)
  const caption = dimensionCaption(spec, density)
  const hasAssumption = layout.dimensions.some((d) => d.assumption)
  const hasClear = layout.dimensions.some((d) => d.measure === 'clear')
  const hasInclusive = layout.dimensions.some((d) => d.measure === 'inclusive')
  const hasKerb = layout.kerbs.length > 0
  const hasPaint = layout.bands.some((b) => b.kind === 'paint')

  return (
    <figure className="m-0 flex flex-col gap-1">
      <CrossSection
        spec={spec}
        density={density}
        title={title}
        ariaLabel={ariaLabel}
        className={className}
      />
      {caption ? (
        <figcaption className="text-[11px] leading-snug text-zinc-600">{caption}</figcaption>
      ) : null}
      {hasAssumption ? (
        <p className="m-0 text-[11px] leading-snug text-zinc-500">
          {callGuideMessage(m.width_guide_assumption_legend, locale)}
        </p>
      ) : null}
      {hasClear ? (
        <p className="m-0 text-[11px] leading-snug text-zinc-500">
          {callGuideMessage(m.width_guide_edge_legend_clear, locale)}
        </p>
      ) : null}
      {hasInclusive ? (
        <p className="m-0 text-[11px] leading-snug text-zinc-500">
          {callGuideMessage(m.width_guide_edge_legend_inclusive, locale)}
        </p>
      ) : null}
      {hasKerb || hasPaint ? (
        <p className="m-0 text-[11px] leading-snug text-zinc-500">
          {callGuideMessage(m.width_guide_kerb_vs_paint, locale)}
        </p>
      ) : null}
      {spec.wayOrientation ? (
        <p className="m-0 text-[11px] leading-snug text-zinc-500">
          {callGuideMessage(m.width_guide_way_orientation, locale)}
        </p>
      ) : null}
      {spec.illustrative ? (
        <p className="m-0 text-[11px] leading-snug text-zinc-500 italic">
          {callGuideMessage(m.width_guide_illustrative_caption, locale)}
        </p>
      ) : null}
    </figure>
  )
}
