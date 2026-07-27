import { formatImageryUsedTag } from './imagery-usage'

export interface BuildChangesetTagsOptions {
  host?: string
  comment?: string
  /** Values for the OSM `imagery_used` tag (joined with `; `). */
  imageryUsed?: string | Iterable<string>
  /** Appended to the comment when not already present (Berlin campaign wiki link). */
  commentWikiUrl?: string
}

function appendCommentWikiUrl(comment: string, wikiUrl: string): string {
  const trimmed = comment.trim()
  if (!wikiUrl || trimmed.includes(wikiUrl)) return trimmed
  return trimmed ? `${trimmed}; ${wikiUrl}` : wikiUrl
}

/** Tags passed to `uploadChangeset` (editor, comment, host). */
export function buildChangesetTags(
  editorName: string,
  editorVersion: string,
  options: BuildChangesetTagsOptions = {},
): Record<string, string> {
  const resolvedHost = options.host ?? `${window.location.origin}${window.location.pathname}`
  const comment = appendCommentWikiUrl(options.comment ?? '', options.commentWikiUrl ?? '')

  const tags: Record<string, string> = {
    created_by: `${editorName} ${editorVersion}`,
    comment,
    host: resolvedHost,
  }

  const imageryUsed =
    typeof options.imageryUsed === 'string'
      ? options.imageryUsed.trim() || undefined
      : formatImageryUsedTag(options.imageryUsed ?? [])

  if (imageryUsed) tags.imagery_used = imageryUsed

  return tags
}
