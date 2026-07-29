import * as m from '@app/paraglide/messages'
import type { ReactNode } from 'react'
import type { UiLocale } from '../../../i18n/uiLocale'
import { callGuideMessage, useMeasureGuideLocale } from './measure-guide-locale'
import { parseResearchDeepLinkParts } from './research-deeplink'
import type { MeasureGuideLink } from './sections'

const wikiLinkClass = 'text-blue-600 hover:underline'

export function WikiLink(props: { href: string; children: ReactNode }) {
  return (
    <a href={props.href} target="_blank" rel="noreferrer" className={wikiLinkClass}>
      {props.children}
    </a>
  )
}

/** Research line with each `§N` / `§N.M` linked to the README hash anchor. */
export function ResearchDeepLinks({ research }: { research: string }) {
  const parts = parseResearchDeepLinkParts(research)
  return (
    <>
      {parts.map((part, index) =>
        part.type === 'ref' ? (
          <WikiLink key={`${part.value}-${index}`} href={part.href}>
            {part.value}
          </WikiLink>
        ) : (
          <span key={`t-${index}`}>{part.value}</span>
        ),
      )}
    </>
  )
}

export function Code({ children }: { children: ReactNode }) {
  return <code className="font-mono text-[0.9em] text-zinc-800">{children}</code>
}

type MessageFn = (inputs?: Record<string, never>, options?: { locale?: UiLocale }) => string

/** Resolve a paraglide message key; pass `locale` from `useMeasureGuideLocale()` when on the audit page. */
export function guideMessage(key: string, locale?: UiLocale): string {
  const fn = (m as unknown as Record<string, MessageFn | undefined>)[key]
  if (!fn) throw new Error(`Missing paraglide message: ${key}`)
  return callGuideMessage(fn, locale)
}

/** Footer of wiki / forum / ML / tool links for a measure-guide section. */
export function SectionWikiLinks(props: { links: readonly MeasureGuideLink[] }) {
  const locale = useMeasureGuideLocale()
  if (props.links.length === 0) return null
  return (
    <p className="m-0 text-[11px] leading-snug text-zinc-500">
      <span className="font-medium text-zinc-600">
        {guideMessage('width_guide_sources_label', locale)}{' '}
      </span>
      {props.links.map((link, index) => (
        <span key={link.href}>
          {index > 0 ? ' · ' : null}
          <WikiLink href={link.href}>{guideMessage(link.labelKey, locale)}</WikiLink>
        </span>
      ))}
    </p>
  )
}
