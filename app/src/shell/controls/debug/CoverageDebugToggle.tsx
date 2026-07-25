import { useNavigate, useSearch } from '@tanstack/react-router'
import { Checkbox, CheckboxField } from '../../../components/catalyst/checkbox'
import { Label } from '../../../components/catalyst/fieldset'
import { serializeMapSearch } from '../../map/search-schema'

export function CoverageDebugToggle() {
  const navigate = useNavigate({ from: '/$mode' })
  const { debug } = useSearch({ from: '/$mode' })

  return (
    <section className="flex flex-col gap-2">
      <h4 className="text-xs font-semibold text-zinc-900">Coverage</h4>
      <CheckboxField>
        <Checkbox
          checked={debug === true}
          onChange={(checked) => {
            void navigate({
              search: (prev) => ({
                ...serializeMapSearch(prev),
                debug: checked ? true : undefined,
              }),
            })
          }}
        />
        <Label>Coverage debug</Label>
      </CheckboxField>
      <p className="text-xs text-zinc-600">
        Show fetch coverage polygons on the map and details on hover.
      </p>
    </section>
  )
}
