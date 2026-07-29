import { useSearch } from '@tanstack/react-router'
import { Checkbox, CheckboxField } from '../../../components/catalyst/checkbox'
import { Label } from '../../../components/catalyst/fieldset'
import { useModeSearchNavigation } from '../../map/use-mode-search-navigation'

export function CoverageDebugToggle() {
  const { updateSearch } = useModeSearchNavigation()
  const { debug } = useSearch({ from: '/$mode' })

  return (
    <section className="flex flex-col gap-2">
      <h4 className="text-xs font-semibold text-zinc-900">Coverage</h4>
      <CheckboxField>
        <Checkbox
          checked={debug === true}
          onChange={(checked) => {
            updateSearch({ debug: checked ? true : undefined })
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
