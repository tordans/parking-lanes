import { Download, X } from 'lucide-react'
import { Button } from '../../../components/catalyst/button'
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogDescription,
  DialogTitle,
} from '../../../components/catalyst/dialog'
import { Tooltip } from '../../../components/Tooltip/Tooltip'
import type { PendingChange } from '../../../utils/changes-store'
import { ChangesetCommentField } from './ChangesetCommentField'
import { PendingChangesList } from './PendingChangesList'

export function SaveChangesDialog(props: {
  open: boolean
  saving: boolean
  uploadHost: string
  uploadLabel: string
  pending: PendingChange[]
  comment: string
  onOpenChange: (open: boolean) => void
  onCommentChange: (comment: string) => void
  onDiscard: (wayId: number) => void
  onDownload: () => void
  onSave: () => void
}) {
  return (
    <Dialog open={props.open} onClose={props.onOpenChange} size="lg">
      <div className="flex items-start justify-between gap-3">
        <DialogTitle>Save changes</DialogTitle>
        <button
          type="button"
          aria-label="Close"
          disabled={props.saving}
          className="shrink-0 rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950 disabled:opacity-50"
          onClick={() => props.onOpenChange(false)}
        >
          <X className="size-5" aria-hidden />
        </button>
      </div>
      <DialogDescription className="!text-base/5 sm:!text-sm/5">
        Review pending OSM edits before uploading a changeset to {props.uploadHost}.
      </DialogDescription>
      <DialogBody>
        <PendingChangesList pending={props.pending} onDiscard={props.onDiscard} />
        <ChangesetCommentField comment={props.comment} onCommentChange={props.onCommentChange} />
      </DialogBody>
      <DialogActions className="sm:justify-between">
        <Tooltip content="Download osmChange (.osc)" placement="top">
          <Button
            outline
            type="button"
            aria-label="Download osmChange (.osc)"
            onClick={props.onDownload}
            disabled={props.saving || props.pending.length === 0}
          >
            <Download data-slot="icon" />
          </Button>
        </Tooltip>
        <Button
          color="yellow"
          onClick={() => void props.onSave()}
          disabled={props.saving || !props.comment.trim()}
        >
          {props.uploadLabel}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
