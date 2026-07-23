import dayjs from 'dayjs'
import { useAppActions, useDatetime } from '../app-store'

export function DatetimeInput() {
  const datetime = useDatetime()
  const { setDatetime } = useAppActions()

  return (
    <input
      id="datetime-input"
      value={dayjs(datetime).format('YYYY-MM-DDTHH:mm')}
      className="datetime"
      type="datetime-local"
      title="If parking:condition present, show kind of parking at this time of day and day of week."
      onChange={(e) => setDatetime(new Date(e.target.value))}
    />
  )
}
