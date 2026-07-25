import { buildChangesetTags, changesStoreToOsmChangeXml } from '@osm-editor-kit/osm-changeset'
import { APP_NAME, APP_VERSION } from '../lib/app-identity'
import { changesStore } from './changes-store'

function downloadTextFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.rel = 'noopener'
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

/** Download pending edits as an osmChange (`.osc`) file using osm-api’s XML builder. */
export function downloadPendingChangesOsc(comment: string) {
  const tags = buildChangesetTags(APP_NAME, APP_VERSION, { comment: comment.trim() })
  const xml = changesStoreToOsmChangeXml(changesStore, { tags })
  const date = new Date().toISOString().slice(0, 10)
  downloadTextFile(`street-space-${date}.osc`, xml, 'application/xml')
}
