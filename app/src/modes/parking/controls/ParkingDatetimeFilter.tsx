import * as m from '@app/paraglide/messages'
import { useParams } from '@tanstack/react-router'
import dayjs from 'dayjs'
import { Field, Label } from '../../../components/catalyst/fieldset'
import { Input } from '../../../components/catalyst/input'
import { useAppActions, useDatetime } from '../../../shell/app-store'

/**
 * Parking-only filter: colors conditional parking access by date/time.
 * Renders nothing outside parking mode.
 */
export function ParkingDatetimeFilter({ fullWidth = false }: { fullWidth?: boolean }) {
  const { mode } = useParams({ from: '/$mode' })
  const datetime = useDatetime()
  const { setDatetime } = useAppActions()

  if (mode !== 'parking') return null

  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold text-zinc-900">{m.parking_data_title()}</h3>
      <Field className="min-w-0 shrink">
        <Label className={fullWidth ? undefined : 'sr-only'}>{m.parking_datetime_label()}</Label>
        <Input
          id="datetime-input"
          value={dayjs(datetime).format('YYYY-MM-DDTHH:mm')}
          className={fullWidth ? 'max-w-none' : 'max-w-40'}
          type="datetime-local"
          title={m.parking_datetime_title()}
          onChange={(e) => setDatetime(new Date(e.target.value))}
        />
      </Field>
    </section>
  )
}
