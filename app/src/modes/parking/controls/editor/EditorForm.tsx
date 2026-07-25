import * as Headless from '@headlessui/react'
import { type OsmTags, type OsmWay } from '@osm-editor-kit/osm-data'
import { useForm, useStore } from '@tanstack/react-form'
import clsx from 'clsx'
import { RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { z } from 'zod'
import { Label } from '../../../../components/catalyst/fieldset'
import { Switch } from '../../../../components/catalyst/switch'
import { Tooltip } from '../../../../components/Tooltip/Tooltip'
import { applyTagMigration, hasTagMigration } from '../../domain/editor/tag-migration'
import { AllTagsBlock } from '../LaneInfo'
import { SideGroup } from './SideGroup'
import {
  tagEditorToolbarButtonClassName,
  tagEditorToolbarButtonGroupClassName,
} from './tag-editor-controls'
import { TagUpdaterModal } from './TagUpdaterModal'

const tagsSchema = z.record(z.string(), z.string())

const sideSwitcherLabelClassName = 'text-xs select-none'

export function LaneEditForm(props: {
  osm: OsmWay
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
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <Headless.Field className="flex items-center gap-2">
          <Label
            className={clsx(
              sideSwitcherLabelClassName,
              bothBlockShown ? 'text-zinc-500' : 'font-semibold text-zinc-950',
            )}
          >
            Left/Right
          </Label>
          <form.Field name="bothBlockShown">
            {(field) => (
              <Switch
                checked={field.state.value}
                disabled={readOnly}
                onChange={field.handleChange}
                aria-label="Toggle both sides editor"
              />
            )}
          </form.Field>
          <Label
            className={clsx(
              sideSwitcherLabelClassName,
              bothBlockShown ? 'font-semibold text-zinc-950' : 'text-zinc-500',
            )}
          >
            Both
          </Label>
        </Headless.Field>
        {!readOnly ? (
          <div className={tagEditorToolbarButtonGroupClassName}>
            {canUpdateTags(props.osm) ? (
              <Tooltip content="Update tags to new scheme" wrapperClassName="shrink-0">
                <button
                  type="button"
                  aria-label="Update tags to new scheme"
                  title="Update tags to new scheme"
                  className={tagEditorToolbarButtonClassName}
                  onClick={() => setTagUpdaterModalShown(true)}
                >
                  <RefreshCw className="size-4 shrink-0" aria-hidden />
                </button>
              </Tooltip>
            ) : null}
          </div>
        ) : null}
      </div>
      <div id="tags-block" className="font-mono">
        <SideGroup
          osm={props.osm}
          side="both"
          shown={bothBlockShown}
          readOnly={readOnly}
          onChange={handleInputChange}
        />
        <SideGroup
          osm={props.osm}
          side="right"
          shown={!bothBlockShown}
          readOnly={readOnly}
          onChange={handleInputChange}
        />
        <SideGroup
          osm={props.osm}
          side="left"
          shown={!bothBlockShown}
          readOnly={readOnly}
          onChange={handleInputChange}
        />
        <AllTagsBlock tags={props.osm.tags} />
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

function canUpdateTags(way: OsmWay) {
  return hasTagMigration(way.tags)
}
