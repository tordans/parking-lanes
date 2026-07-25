import { type OsmWay } from '@osm-editor-kit/osm-data'
import { RefreshCw } from 'lucide-react'
import { Tooltip } from '../../../../components/Tooltip/Tooltip'
import { hasTagMigration } from '../../domain/editor/tag-migration'
import {
  tagEditorToolbarButtonClassName,
  tagEditorToolbarButtonGroupClassName,
} from './tag-editor-controls'

export function TagMigrationToolbar(props: {
  osm: OsmWay
  readOnly: boolean
  onOpenTagUpdater: () => void
}) {
  if (props.readOnly || !hasTagMigration(props.osm.tags)) return null

  return (
    <div className={tagEditorToolbarButtonGroupClassName}>
      <Tooltip content="Update tags to new scheme" wrapperClassName="shrink-0">
        <button
          type="button"
          aria-label="Update tags to new scheme"
          title="Update tags to new scheme"
          className={tagEditorToolbarButtonClassName}
          onClick={props.onOpenTagUpdater}
        >
          <RefreshCw className="size-4 shrink-0" aria-hidden />
        </button>
      </Tooltip>
    </div>
  )
}
