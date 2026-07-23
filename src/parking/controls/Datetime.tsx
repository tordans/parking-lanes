import dayjs from 'dayjs'
import { Field, Label } from '../../components/catalyst/fieldset'
import { Input } from '../../components/catalyst/input'
import { useAppActions, useDatetime } from '../app-store'

export function DatetimeInput() {
  const datetime = useDatetime()
  const { setDatetime } = useAppActions()

  return (
    <Field className="min-w-0 shrink">
      <Label className="sr-only">Date and time</Label>
      <Input
        id="datetime-input"
        value={dayjs(datetime).format('YYYY-MM-DDTHH:mm')}
        className="max-w-40"
        type="datetime-local"
        title="If parking:condition present, show kind of parking at this time of day and day of week."
        onChange={(e) => setDatetime(new Date(e.target.value))}
      />
    </Field>
  )
}
