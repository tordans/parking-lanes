import { serializeMapParam } from '@osm-editor-kit/osm-map-url'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { Checkbox, CheckboxField } from '../../components/catalyst/checkbox'
import { Label } from '../../components/catalyst/fieldset'
import { useOsmDisplayName } from '../app-store'
import { canShowDebugToggle } from '../debug'

export function CoverageDebugToggle() {
  const navigate = useNavigate({ from: '/' })
  const { debug } = useSearch({ from: '/' })
  const osmDisplayName = useOsmDisplayName()

  if (!canShowDebugToggle(osmDisplayName, debug)) return null

  return (
    <div className="rounded-lg bg-white/90 px-2 py-1 text-sm shadow-xs ring-1 ring-zinc-950/5 backdrop-blur-sm">
      <CheckboxField className="inline-grid! grid-cols-[auto_auto]! gap-x-1.5!">
        <Checkbox
          checked={debug === true}
          onChange={(checked) => {
            void navigate({
              search: (prev) => ({
                map: prev.map ? serializeMapParam(prev.map) : undefined,
                debug: checked ? true : undefined,
              }),
            })
          }}
        />
        <Label>Coverage debug</Label>
      </CheckboxField>
    </div>
  )
}
