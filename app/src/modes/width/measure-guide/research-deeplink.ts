import { APP_REPO_URL } from '../../../lib/app-identity'

/** GitHub blob URL for the width-measurements deep dive. */
export const RESEARCH_README_URL = `${APP_REPO_URL}/blob/main/research/width-measurements/README.md`

/**
 * Stable HTML id in `research/width-measurements/README.md` for a `§N` / `§N.M` ref.
 * Matches `<a id="sec-…"></a>` anchors in that file (not GitHub’s auto-slug).
 */
export function researchSectionAnchor(ref: string): string | null {
  const match = /^§(\d+)(?:\.(\d+))?$/.exec(ref)
  if (!match) return null
  const major = match[1]!
  const minor = match[2]
  return minor ? `sec-${major}-${minor}` : `sec-${major}`
}

export function researchSectionHref(ref: string): string | null {
  const id = researchSectionAnchor(ref)
  return id ? `${RESEARCH_README_URL}#${id}` : null
}

export type ResearchDeepLinkPart =
  | { type: 'text'; value: string }
  | { type: 'ref'; value: string; href: string }

/**
 * Split a research line (`§2.2 + §3.1/§3.2`) into plain text and deeplinked § tokens.
 * Separators (`+`, `/`, ` · `, ` Scenario B`, …) stay as text.
 */
export function parseResearchDeepLinkParts(research: string): ResearchDeepLinkPart[] {
  return research
    .split(/(§\d+(?:\.\d+)?)/g)
    .filter((part) => part.length > 0)
    .map((value) => {
      const href = researchSectionHref(value)
      if (href) return { type: 'ref', value, href }
      return { type: 'text', value }
    })
}
