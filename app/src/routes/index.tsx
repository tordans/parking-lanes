import { createFileRoute, redirect } from '@tanstack/react-router'
import { mapSearchSchema, serializeMapSearch } from '../shell/map/search-schema'

/** Root entry: send first load to the parking mode slug. */
export const Route = createFileRoute('/')({
  validateSearch: mapSearchSchema,
  beforeLoad: ({ search }) => {
    throw redirect({
      to: '/$mode',
      params: { mode: 'parking' },
      search: serializeMapSearch(search),
      replace: true,
    })
  },
})
