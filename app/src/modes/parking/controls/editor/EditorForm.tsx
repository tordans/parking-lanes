import { type OsmWay } from '@osm-editor-kit/osm-data'
import { useEffect, useState } from 'react'
import { type TagCommitOptions, useOsmTagDraft } from '../../../../components/tag-editor'
import { AllTagsBlock } from '../../../../shell/controls/AllTagsBlock'
import { ModePanelIntro } from '../../../../shell/controls/ModePanelIntro'
import type { Side } from '../../../../utils/types/parking'
import { applyTagMigration } from '../../domain/editor/tag-migration'
import { useParkingMapActions } from '../../map/parking-map-store'
import { isParkingBothMode } from '../../side-colors'
import { SideGroup } from './SideGroup'
import { SideModeSwitcher } from './SideModeSwitcher'
import { TagMigrationToolbar } from './TagMigrationToolbar'
import { TagUpdaterModal } from './TagUpdaterModal'

export function LaneEditForm(props: {
  osm: OsmWay
  sideOrder: [Side, Side]
  readOnly?: boolean
  onChange: (way: OsmWay) => void
}) {
  const readOnly = props.readOnly ?? false
  const { setSelectedSideMode } = useParkingMapActions()
  const [bothBlockShown, setBothBlockShown] = useState(() => isParkingBothMode(props.osm.tags))
  const [tagUpdaterModalShown, setTagUpdaterModalShown] = useState(false)

  const { draftTags, draftWay, setTag, setTags } = useOsmTagDraft({
    way: props.osm,
    onCommit: props.onChange,
  })

  useEffect(
    function syncSelectedSideModeToMap() {
      setSelectedSideMode(bothBlockShown ? 'both' : 'split')
      return () => setSelectedSideMode(null)
    },
    [bothBlockShown, setSelectedSideMode],
  )

  function handleInputChange(key: string, value: string, options?: TagCommitOptions) {
    if (readOnly) return
    setTag(key, value, options)
  }

  function handleUpdateTagsClick() {
    setTags({ ...applyTagMigration(draftTags) }, { immediate: true })
  }

  return (
    <form
      id={props.osm.type + props.osm.id}
      key={props.osm.type + props.osm.id}
      className="editor-form flex flex-col gap-4 text-zinc-900"
    >
      <ModePanelIntro
        wayId={props.osm.id}
        highway={draftWay.tags.highway}
        className="flex items-center gap-2"
        leading={
          <SideModeSwitcher
            bothBlockShown={bothBlockShown}
            sideOrder={props.sideOrder}
            readOnly={readOnly}
            onBothBlockShownChange={setBothBlockShown}
          />
        }
        trailing={
          <TagMigrationToolbar
            osm={draftWay}
            readOnly={readOnly}
            onOpenTagUpdater={() => setTagUpdaterModalShown(true)}
          />
        }
      />
      <div id="tags-block" className="font-mono">
        <SideGroup
          osm={draftWay}
          side="both"
          shown={bothBlockShown}
          readOnly={readOnly}
          onChange={handleInputChange}
        />
        {props.sideOrder.map((side) => (
          <SideGroup
            key={side}
            osm={draftWay}
            side={side}
            shown={!bothBlockShown}
            readOnly={readOnly}
            onChange={handleInputChange}
          />
        ))}
        <AllTagsBlock tags={draftTags} highlightKeyPrefix="parking:" />
      </div>

      {!readOnly ? (
        <TagUpdaterModal
          open={tagUpdaterModalShown}
          osm={draftWay}
          onUpdate={() => handleUpdateTagsClick()}
          onClose={() => setTagUpdaterModalShown(false)}
        />
      ) : null}
    </form>
  )
}
