import { useState } from 'react'
import { type OsmTags, type OsmWay } from '../../../utils/types/osm-data'
import { type WaysInRelation } from '../../../utils/types/osm-data-storage'
import { applyTagMigration, hasTagMigration } from '../../domain/editor/tag-migration'
import { AllTagsBlock } from '../LaneInfo'
import { SideGroup } from './SideGroup'
import { TagUpdaterModal } from './TagUpdaterModal'

export function LaneEditForm(props: {
  osm: OsmWay
  waysInRelation: WaysInRelation
  onCutLane: (way: OsmWay) => void
  onChange: (way: OsmWay) => void
}) {
  const existsRightTags = existsSideTags(props.osm.tags, 'right')
  const existsLeftTags = existsSideTags(props.osm.tags, 'left')
  const existsBothTags = existsSideTags(props.osm.tags, 'both')

  const [bothBlockShown, setBothBlockShown] = useState(
    !existsRightTags && !existsLeftTags && existsBothTags,
  )
  const [tagUpdaterModalShown, setTagUpdaterModalShown] = useState(false)

  const forceUpdate = useForceUpdate()

  return (
    <form
      id={props.osm.type + props.osm.id}
      key={props.osm.type + props.osm.id}
      className="editor-form"
    >
      <div className="editor-form__header">
        <label className="editor-form__side-switcher">
          <input
            id="side-switcher"
            type="checkbox"
            className="editor-form__side-switcher-checkbox"
            onChange={() => setBothBlockShown(!bothBlockShown)}
          />
          Both
        </label>
        <div className="editor-form__utils">
          <button
            title="Cut lane"
            type="button"
            className="editor-form__cut-button"
            style={{ display: props.waysInRelation[props.osm.id] ? 'none' : undefined }}
            onClick={() => props.onCutLane(props.osm)}
          >
            ✂
          </button>
          <button
            title="Update tags"
            type="button"
            className="editor-form__cut-button"
            style={{ display: canUpdateTags(props.osm) ? undefined : 'none' }}
            onClick={() => setTagUpdaterModalShown(true)}
          >
            🔄
          </button>
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

      {tagUpdaterModalShown ? (
        <TagUpdaterModal
          osm={props.osm}
          onUpdate={() => handleUpdateTagsClick()}
          onClose={() => setTagUpdaterModalShown(false)}
        />
      ) : null}
    </form>
  )

  function handleInputChange(key: string, value: string) {
    if (value) props.osm.tags[key] = value
    else
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete props.osm.tags[key]
    props.onChange(props.osm)

    forceUpdate()
  }

  function handleUpdateTagsClick() {
    const migratedTags = applyTagMigration(props.osm.tags)
    for (const key of Object.keys(props.osm.tags)) {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete props.osm.tags[key]
    }
    Object.assign(props.osm.tags, migratedTags)
  }
}

function useForceUpdate() {
  const [, setValue] = useState(0)
  return () => setValue((value) => value + 1)
}

function existsSideTags(tags: OsmTags, side: string) {
  const regex = new RegExp(`^parking:.*${side}`)
  return Object.keys(tags).some((x) => regex.test(x))
}

function canUpdateTags(way: OsmWay) {
  return hasTagMigration(way.tags)
}
