/** Tags passed to `uploadChangeset` (editor, comment, host). */
export function buildChangesetTags(
  editorName: string,
  editorVersion: string,
  host?: string,
): Record<string, string> {
  const resolvedHost = host ?? `${window.location.origin}${window.location.pathname}`

  return {
    created_by: `${editorName} ${editorVersion}`,
    comment: 'Parking lanes',
    host: resolvedHost,
  }
}
