import { type OsmTags, type OsmWay } from '@osm-editor-kit/osm-data'
import { useForm, useStore } from '@tanstack/react-form'
import { useState } from 'react'
import { z } from 'zod'
import { AllTagsBlock } from '../../../../shell/controls/AllTagsBlock'
import { ModePanelIntro } from '../../../../shell/controls/ModePanelIntro'
import type { Side } from '../../../../utils/types/parking'
import { applyTagMigration } from '../../domain/editor/tag-migration'
import { SideGroup } from './SideGroup'
import { SideModeSwitcher } from './SideModeSwitcher'
import { TagMigrationToolbar } from './TagMigrationToolbar'
import { TagUpdaterModal } from './TagUpdaterModal'

const tagsSchema = z.record(z.string(), z.string())

export function LaneEditForm(props: {
  osm: OsmWay
  sideOrder: [Side, Side]
  readOnly?: boolean
  onChange: (way: OsmWay) => void
}) {
  const readOnly = props.readOnly ?? false
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
      className="editor-form text-zinc-900"
    >
      <ModePanelIntro
        wayId={props.osm.id}
        highway={props.osm.tags.highway}
        leading={
          <form.Field name="bothBlockShown">
            {(field) => (
              <SideModeSwitcher
                bothBlockShown={bothBlockShown}
                sideOrder={props.sideOrder}
                readOnly={readOnly}
                onBothBlockShownChange={field.handleChange}
              />
            )}
          </form.Field>
        }
        trailing={
          <TagMigrationToolbar
            osm={props.osm}
            readOnly={readOnly}
            onOpenTagUpdater={() => setTagUpdaterModalShown(true)}
          />
        }
      />
      <div id="tags-block" className="font-mono">
        <SideGroup
          osm={props.osm}
          side="both"
          shown={bothBlockShown}
          readOnly={readOnly}
          onChange={handleInputChange}
        />
        {props.sideOrder.map((side) => (
          <SideGroup
            key={side}
            osm={props.osm}
            side={side}
            shown={!bothBlockShown}
            readOnly={readOnly}
            onChange={handleInputChange}
          />
        ))}
        <AllTagsBlock tags={props.osm.tags} highlightKeyPrefix="parking:" />
      </div>

      {!readOnly ? (
        <TagUpdaterModal
          open={tagUpdaterModalShown}
          osm={props.osm}
          onUpdate={() => handleUpdateTagsClick()}
          onClose={() => setTagUpdaterModalShown(false)}
        />
      ) : null}
    </form>
  )

  function handleInputChange(key: string, value: string) {
    if (readOnly) return

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
