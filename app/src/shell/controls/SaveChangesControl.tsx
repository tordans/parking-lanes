import { osmDevUrl } from '@osm-editor-kit/osm-editor-links'
import clsx from 'clsx'
import { Upload } from 'lucide-react'
import { useState } from 'react'
import { Tooltip } from '../../components/Tooltip/Tooltip'
import {
  allPendingSources,
  listPendingChanges,
  removeChangedEntity,
  type PendingChange,
} from '../../utils/changes-store'
import { buildChangesetComment } from '../../utils/changeset-message'
import { downloadPendingChangesOsc } from '../../utils/download-pending-osc'
import { useAppActions, useChangesCount } from '../app-store'
import { useUseOsmDevServer } from '../debug-settings-store'
import { floatingChromeElevationClassName } from '../map/mobileMapChrome.const'
import { useSavePendingChanges } from '../map/use-save-pending-changes'
import { SaveChangesDialog } from './save-changes/SaveChangesDialog'

export function SaveChangesControl() {
  const changesCount = useChangesCount()
  const useOsmDevServer = useUseOsmDevServer()
  const { setChangesCount } = useAppActions()
  const { handleSave: savePendingChanges, handleDiscardWay } = useSavePendingChanges()
  const [open, setOpen] = useState(false)
  const [comment, setComment] = useState('')
  const [pending, setPending] = useState<PendingChange[]>([])
  const [saving, setSaving] = useState(false)

  const hasChanges = changesCount > 0
  const uploadHost = useOsmDevServer ? osmDevUrl.replace(/^https:\/\//, '') : 'openstreetmap.org'
  const uploadLabel = saving ? 'Uploading…' : `Upload to ${uploadHost}`

  function refreshPending() {
    const next = listPendingChanges()
    setPending(next)
    setComment(
      buildChangesetComment(
        next.map((change) => change.way),
        allPendingSources(),
      ),
    )
  }

  function handleOpen() {
    if (!hasChanges) return
    refreshPending()
    setOpen(true)
  }

  function handleDiscard(wayId: number) {
    const result = removeChangedEntity(wayId)
    handleDiscardWay(wayId, result)
    setChangesCount(result.count)
    if (result.count === 0) {
      setOpen(false)
      setPending([])
      return
    }
    refreshPending()
  }

  function handleDownload() {
    downloadPendingChangesOsc(comment)
  }

  async function handleSave() {
    const trimmed = comment.trim()
    if (!trimmed || saving) return
    setSaving(true)
    try {
      await savePendingChanges(trimmed)
      setOpen(false)
      setPending([])
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Tooltip
        content={
          hasChanges
            ? `Upload ${changesCount} change${changesCount === 1 ? '' : 's'}`
            : 'No pending changes'
        }
        placement="bottom"
      >
        <button
          type="button"
          aria-label={
            hasChanges
              ? `Upload ${changesCount} change${changesCount === 1 ? '' : 's'}`
              : 'No pending changes'
          }
          disabled={!hasChanges}
          className={clsx(
            'relative flex size-10 shrink-0 items-center justify-center rounded-lg',
            floatingChromeElevationClassName,
            hasChanges
              ? 'cursor-pointer bg-yellow-300 text-yellow-950 hover:bg-yellow-200 active:bg-yellow-400'
              : 'cursor-not-allowed bg-white text-zinc-400 opacity-60',
          )}
          onClick={handleOpen}
        >
          <Upload className="size-5" aria-hidden />
          {hasChanges ? (
            <span className="absolute -top-1 -right-1 flex size-4 min-w-4 items-center justify-center rounded-full bg-yellow-500 text-[10px] leading-none font-semibold text-yellow-950 ring-2 ring-white">
              {changesCount > 99 ? '99+' : changesCount}
            </span>
          ) : null}
        </button>
      </Tooltip>

      <SaveChangesDialog
        open={open}
        saving={saving}
        uploadHost={uploadHost}
        uploadLabel={uploadLabel}
        pending={pending}
        comment={comment}
        onOpenChange={setOpen}
        onCommentChange={setComment}
        onDiscard={handleDiscard}
        onDownload={handleDownload}
        onSave={() => void handleSave()}
      />
    </>
  )
}
