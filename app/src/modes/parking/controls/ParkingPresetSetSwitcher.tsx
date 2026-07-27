import * as m from '@app/paraglide/messages'
import { Label } from '../../../components/catalyst/fieldset'
import { Radio, RadioField, RadioGroup } from '../../../components/catalyst/radio'
import { parkingPresetSetIds, type ParkingPresetSetId } from '../domain/editor/preset-sets'
import { useParkingPresetSet } from '../use-parking-preset-set'

const presetSetLabels: Record<ParkingPresetSetId, () => string> = {
  default: m.parking_preset_set_default,
  russia: m.parking_preset_set_russia,
}

export function ParkingPresetSetSwitcher() {
  const { presetSet, setPresetSet } = useParkingPresetSet()

  return (
    <RadioGroup
      value={presetSet}
      onChange={(value) => setPresetSet(value as ParkingPresetSetId)}
      aria-label={m.parking_preset_set_title()}
      className="!space-y-2"
    >
      {parkingPresetSetIds.map((setId) => (
        <RadioField key={setId}>
          <Radio value={setId} color="dark/zinc" />
          <Label>{presetSetLabels[setId]()}</Label>
        </RadioField>
      ))}
    </RadioGroup>
  )
}
