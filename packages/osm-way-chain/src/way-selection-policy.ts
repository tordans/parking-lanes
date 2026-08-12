import type { OsmTags } from '@osm-editor-kit/osm-data'
import type { Segment } from './domain/types'

/**
 * Atomic tag predicate. Compiles 1:1 to Overpass filter syntax and the same
 * semantics when matching in-memory `OsmTags` (missing tag matches `neq` / `nin`
 * / `absent`, same as Overpass).
 */
export type OsmTagPredicate =
  | { readonly key: string; readonly op: 'eq' | 'neq'; readonly value: string }
  | { readonly key: string; readonly op: 'in' | 'nin'; readonly values: readonly string[] }
  | { readonly key: string; readonly op: 'regex' | 'nregex'; readonly pattern: string }
  | { readonly key: string; readonly op: 'present' | 'absent' }

/** One AND-group of tag predicates — one `way[...]` branch in Overpass. */
export type OsmWayFilterClause = {
  readonly all: readonly OsmTagPredicate[]
}

/**
 * Declarative way-selection policy (app-owned contract).
 *
 * - `include`: OR — union of Overpass `way[...](bbox)` statements
 * - `globalAll`: AND — appended to every include clause (e.g. access exclusions)
 */
export type OsmWaySelectionPolicy = {
  readonly include: readonly OsmWayFilterClause[]
  readonly globalAll?: readonly OsmTagPredicate[]
}

/** Ergonomic constructors for {@link OsmTagPredicate}. */
export const tag = {
  eq: (key: string, value: string): OsmTagPredicate => ({ key, op: 'eq', value }),
  neq: (key: string, value: string): OsmTagPredicate => ({ key, op: 'neq', value }),
  oneOf: (key: string, values: readonly string[]): OsmTagPredicate => ({
    key,
    op: 'in',
    values,
  }),
  noneOf: (key: string, values: readonly string[]): OsmTagPredicate => ({
    key,
    op: 'nin',
    values,
  }),
  regex: (key: string, pattern: string): OsmTagPredicate => ({ key, op: 'regex', pattern }),
  nregex: (key: string, pattern: string): OsmTagPredicate => ({ key, op: 'nregex', pattern }),
  present: (key: string): OsmTagPredicate => ({ key, op: 'present' }),
  absent: (key: string): OsmTagPredicate => ({ key, op: 'absent' }),
} as const

function escapeRegexAlternation(values: readonly string[]): string {
  return values.map((value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')
}

function quoteOverpassValue(value: string): string {
  if (/^[A-Za-z0-9_:-]+$/.test(value)) return value
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
}

function escapeOverpassRegex(pattern: string): string {
  return pattern.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

function compileTagPredicate(predicate: OsmTagPredicate): string {
  switch (predicate.op) {
    case 'eq':
      return `[${predicate.key}=${quoteOverpassValue(predicate.value)}]`
    case 'neq':
      return `[${predicate.key}!=${quoteOverpassValue(predicate.value)}]`
    case 'in':
      return `[${predicate.key}~"^(${escapeRegexAlternation(predicate.values)})$"]`
    case 'nin':
      return `[${predicate.key}!~"^(${escapeRegexAlternation(predicate.values)})$"]`
    case 'regex':
      return `[${predicate.key}~"${escapeOverpassRegex(predicate.pattern)}"]`
    case 'nregex':
      return `[${predicate.key}!~"${escapeOverpassRegex(predicate.pattern)}"]`
    case 'present':
      return `[${predicate.key}]`
    case 'absent':
      return `[!${predicate.key}]`
  }
}

function clausePredicates(policy: OsmWaySelectionPolicy, clause: OsmWayFilterClause) {
  return [...clause.all, ...(policy.globalAll ?? [])]
}

/**
 * Compiles each include clause to an Overpass way-filter suffix, e.g.
 * `[highway=cycleway][access!=private]`.
 * Callers wrap these in `way…(bbox)` union statements.
 */
export function compileOverpassWaySelectors(policy: OsmWaySelectionPolicy): string[] {
  if (policy.include.length === 0) {
    throw new Error('OsmWaySelectionPolicy.include must contain at least one clause')
  }
  return policy.include.map((clause) =>
    clausePredicates(policy, clause).map(compileTagPredicate).join(''),
  )
}

/** Single selector when the policy has exactly one include clause; otherwise throws. */
export function compileOverpassWaySelector(policy: OsmWaySelectionPolicy): string {
  const selectors = compileOverpassWaySelectors(policy)
  if (selectors.length !== 1) {
    throw new Error(
      `compileOverpassWaySelector expects exactly one include clause, got ${selectors.length}`,
    )
  }
  return selectors[0]!
}

function matchesTagPredicate(tags: OsmTags, predicate: OsmTagPredicate): boolean {
  const raw = tags[predicate.key]
  switch (predicate.op) {
    case 'eq':
      return raw === predicate.value
    case 'neq':
      return raw !== predicate.value
    case 'in':
      return raw != null && predicate.values.includes(raw)
    case 'nin':
      return raw == null || !predicate.values.includes(raw)
    case 'regex':
      return raw != null && new RegExp(predicate.pattern).test(raw)
    case 'nregex':
      return raw == null || !new RegExp(predicate.pattern).test(raw)
    case 'present':
      return raw != null && raw !== ''
    case 'absent':
      return raw == null || raw === ''
  }
}

function matchesClause(tags: OsmTags, predicates: readonly OsmTagPredicate[]): boolean {
  return predicates.every((predicate) => matchesTagPredicate(tags, predicate))
}

/** Whether OSM tags match the policy (OR of include clauses, each with globalAll). */
export function matchesOsmWaySelection(tags: OsmTags, policy: OsmWaySelectionPolicy): boolean {
  return policy.include.some((clause) => matchesClause(tags, clausePredicates(policy, clause)))
}

export function matchesOsmWaySelectionSegment(
  segment: Segment,
  policy: OsmWaySelectionPolicy,
): boolean {
  return matchesOsmWaySelection(segment.tags, policy)
}

/** Builds Overpass QL that downloads matching ways (+ their nodes) for a bbox string. */
export function buildWaysOverpassQuery(
  policy: OsmWaySelectionPolicy,
  bbox: string,
  options?: { readonly timeoutSeconds?: number; readonly out?: 'meta' | 'body' },
): string {
  const selectors = compileOverpassWaySelectors(policy)
  const timeout = options?.timeoutSeconds ?? 60
  const out = options?.out ?? 'meta'
  const union = selectors.map((selector) => `way${selector}(${bbox});`).join('')
  return `[out:xml][timeout:${timeout}];(${union});(._;>;);out ${out};`
}
