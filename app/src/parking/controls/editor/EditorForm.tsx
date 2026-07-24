import { type OsmTags, type OsmWay } from '@osm-editor-kit/osm-data'
import { type WaysInRelation } from '@osm-editor-kit/osm-data'
import { useForm, useStore } from '@tanstack/react-form'
import { useState } from 'react'
import { z } from 'zod'
import { Button } from '../../../components/catalyst/button'
import { Checkbox, CheckboxField } from '../../../components/catalyst/checkbox'
import { Label } from '../../../components/catalyst/fieldset'
import { applyTagMigration, hasTagMigration } from '../../domain/editor/tag-migration'
import { AllTagsBlock } from '../LaneInfo'
import { SideGroup } from './SideGroup'
import { TagUpdaterModal } from './TagUpdaterModal'

const tagsSchema = z.record(z.string(), z.string())

export function LaneEditForm(props: {
  osm: OsmWay
  waysInRelation: WaysInRelation
  onCutLane: (way: OsmWay) => void
  onChange: (way: OsmWay) => void
}) {
  const existsRightTags = existsSideTags(props.osm.tags, 'right')
  const existsLeftTags = existsSideTags(props.osm.tags, 'left')
  const existsBothTags = existsSideTags(props.osm.tags, 'both')

  const form = useForm({
    defaultValues: {
      bothBlockShown: !existsRightTags && !existsLeftTags && existsBothTags,
      tags: { ...props.osm.tags },
    },
    validators: {
      onChange: z.object({
        bothBlockShown: z.boolean(),
        tags: tagsSchema,
      }),
    },
    onSubmit: () => undefined,
  })

  const bothBlockShown = useStore(form.store, (state) => state.values.bothBlockShown)
  const [tagUpdaterModalShown, setTagUpdaterModalShown] = useState(false)

  return (
    <form
      id={props.osm.type + props.osm.id}
      key={props.osm.type + props.osm.id}
      className="editor-form"
    >
      <div className="mb-2 flex items-center justify-between">
        <CheckboxField className="grid-cols-[auto_auto]! gap-x-2!">
          <form.Field name="bothBlockShown">
            {(field) => (
              <Checkbox
                id="side-switcher"
                checked={field.state.value}
                onChange={field.handleChange}
              />
            )}
          </form.Field>
          <Label htmlFor="side-switcher">Both</Label>
        </CheckboxField>
        <div className="flex gap-1">
          <Button
            title="Cut lane"
            type="button"
            plain
            className={props.waysInRelation[props.osm.id] ? 'hidden' : ''}
            onClick={() => props.onCutLane(props.osm)}
          >
            ✂
          </Button>
          <Button
            title="Update tags"
            type="button"
            plain
            className={canUpdateTags(props.osm) ? '' : 'hidden'}
            onClick={() => setTagUpdaterModalShown(true)}
          >
            🔄
          </Button>
        </div>
      </div>
      <div id="tags-block">
        <SideGroup
          osm={props.osm}
          side="both"
          shown={bothBlockShown}
          onChange={handleInputChange}
        />
        <SideGroup
          osm={props.osm}
          side="right"
          shown={!bothBlockShown}
          onChange={handleInputChange}
        />
        <SideGroup
          osm={props.osm}
          side="left"
          shown={!bothBlockShown}
          onChange={handleInputChange}
        />
        <AllTagsBlock tags={props.osm.tags} />
      </div>

      <TagUpdaterModal
        open={tagUpdaterModalShown}
        osm={props.osm}
        onUpdate={() => handleUpdateTagsClick()}
        onClose={() => setTagUpdaterModalShown(false)}
      />
    </form>
  )

  function handleInputChange(key: string, value: string) {
    const nextTags = { ...form.getFieldValue('tags') }
    if (value) nextTags[key] = value
    else
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete nextTags[key]

    form.setFieldValue('tags', nextTags)
    props.onChange({ ...props.osm, tags: nextTags })
  }

  function handleUpdateTagsClick() {
    const migratedTags = applyTagMigration(form.getFieldValue('tags'))
    form.setFieldValue('tags', { ...migratedTags })
    props.onChange({ ...props.osm, tags: migratedTags })
  }
}

function existsSideTags(tags: OsmTags, side: string) {
  const regex = new RegExp(`^parking:.*${side}`)
  return Object.keys(tags).some((x) => regex.test(x))
}

function canUpdateTags(way: OsmWay) {
  return hasTagMigration(way.tags)
}
