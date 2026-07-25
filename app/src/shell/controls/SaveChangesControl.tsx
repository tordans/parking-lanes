import { osmDevUrl } from '@osm-editor-kit/osm-editor-links'
import clsx from 'clsx'
import { Download, Trash2, Upload } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../../components/catalyst/button'
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogDescription,
  DialogTitle,
} from '../../components/catalyst/dialog'
import { Field, Label } from '../../components/catalyst/fieldset'
import { Textarea } from '../../components/catalyst/textarea'
import { Tooltip } from '../../components/Tooltip/Tooltip'
import {
  allPendingSources,
  listPendingChanges,
  removeChangedEntity,
  type PendingChange,
} from '../../utils/changes-store'
import { buildChangesetComment, wayHasStreetName } from '../../utils/changeset-message'
import { downloadPendingChangesOsc } from '../../utils/download-pending-osc'
import { useAppActions, useChangesCount } from '../app-store'
import { useUseOsmDevServer } from '../debug-settings-store'
import { floatingChromeElevationClassName } from '../map/mobileMapChrome.const'

export function SaveChangesControl(props: {
  onSave: (comment: string) => Promise<void>
  onDiscardWay: (wayId: number, result: ReturnType<typeof removeChangedEntity>) => void
}) {
  const changesCount = useChangesCount()
  const useOsmDevServer = useUseOsmDevServer()
  const { setChangesCount } = useAppActions()
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
    props.onDiscardWay(wayId, result)
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
      await props.onSave(trimmed)
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

      <Dialog open={open} onClose={setOpen} size="lg">
        <DialogTitle>Save changes</DialogTitle>
        <DialogDescription>
          Review pending OSM edits before uploading a changeset to {uploadHost}.
        </DialogDescription>
        <DialogBody>
          <ul className="max-h-64 space-y-3 overflow-auto rounded-lg bg-zinc-50 p-3 ring-1 ring-zinc-950/5">
            {pending.map((change) => (
              <li key={change.way.id} className="rounded-md bg-white p-3 ring-1 ring-zinc-950/5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate font-medium text-zinc-950">way/{change.way.id}</div>
                    {wayHasStreetName(change.way) ? (
                      <div className="truncate text-xs text-zinc-500">{change.displayName}</div>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    aria-label={`Remove way/${change.way.id}`}
                    className="shrink-0 rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-red-700"
                    onClick={() => handleDiscard(change.way.id)}
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </div>
                {change.tagChanges.length > 0 ? (
                  <ul className="mt-2 space-y-1 font-mono text-xs text-zinc-700">
                    {change.tagChanges.map((tag) => (
                      <li key={tag.key} className="break-all">
                        <span className="text-zinc-500">{tag.key}=</span>
                        {tag.from === null ? (
                          <span className="text-emerald-700">{tag.to}</span>
                        ) : tag.to === null ? (
                          <span className="text-red-700 line-through">{tag.from}</span>
                        ) : (
                          <>
                            <span className="text-red-700 line-through">{tag.from}</span>
                            <span className="text-zinc-400"> → </span>
                            <span className="text-emerald-700">{tag.to}</span>
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-xs text-zinc-500">Geometry change (no tag edits)</p>
                )}
              </li>
            ))}
          </ul>

          <Field className="mt-6">
            <Label>Changeset message</Label>
            <Textarea
              rows={3}
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              resizable={false}
            />
          </Field>
        </DialogBody>
        <DialogActions className="sm:justify-between">
          <Tooltip content="Download osmChange (.osc)" placement="top">
            <Button
              outline
              type="button"
              aria-label="Download osmChange (.osc)"
              onClick={handleDownload}
              disabled={saving || pending.length === 0}
            >
              <Download data-slot="icon" />
            </Button>
          </Tooltip>
          <div className="flex w-full flex-col-reverse items-center justify-end gap-3 sm:w-auto sm:flex-row">
            <Button plain onClick={() => setOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button
              color="yellow"
              onClick={() => void handleSave()}
              disabled={saving || !comment.trim()}
            >
              {uploadLabel}
            </Button>
          </div>
        </DialogActions>
      </Dialog>
    </>
  )
}
