import * as m from '@app/paraglide/messages'
import { Field, Label } from '../../../components/catalyst/fieldset'
import { Textarea } from '../../../components/catalyst/textarea'

export function ChangesetCommentField(props: {
  comment: string
  onCommentChange: (comment: string) => void
}) {
  return (
    <Field className="mt-4 [&>[data-slot=label]+[data-slot=control]]:mt-1.5">
      <Label>{m.save_changeset_message()}</Label>
      <Textarea
        rows={3}
        value={props.comment}
        onChange={(event) => props.onCommentChange(event.target.value)}
        resizable={false}
      />
    </Field>
  )
}
