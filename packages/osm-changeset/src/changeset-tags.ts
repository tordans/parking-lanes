export interface BuildChangesetTagsOptions {
  host?: string
  comment?: string
}

/** Tags passed to `uploadChangeset` (editor, comment, host). */
export function buildChangesetTags(
  editorName: string,
  editorVersion: string,
  options: BuildChangesetTagsOptions = {},
): Record<string, string> {
  const resolvedHost = options.host ?? `${window.location.origin}${window.location.pathname}`

  return {
    created_by: `${editorName} ${editorVersion}`,
    comment: options.comment ?? '',
    host: resolvedHost,
  }
}
