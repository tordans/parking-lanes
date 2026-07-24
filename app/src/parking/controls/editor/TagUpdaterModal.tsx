import { Button } from '../../../components/catalyst/button'
import { Dialog, DialogActions, DialogBody, DialogTitle } from '../../../components/catalyst/dialog'
import { type OsmWay } from '../../../utils/types/osm-data'
import { getTagMigrationInfo } from '../../domain/editor/tag-migration'

export function TagUpdaterModal(props: {
  open: boolean
  osm: OsmWay
  onUpdate: () => void
  onClose: () => void
}) {
  const updateInfo = getTagMigrationInfo(props.osm.tags)

  return (
    <Dialog open={props.open} onClose={props.onClose} size="3xl">
      <DialogTitle>Update tags to new scheme</DialogTitle>
      <DialogBody>
        <div id="updated-tags">
          <h3 className="text-sm font-medium text-zinc-600">Updated tags</h3>
          <table className="mt-2 w-full border-collapse text-sm">
            <thead>
              <tr className="bg-zinc-100">
                <th className="p-2 text-left">Old tag</th>
                <th className="p-2 text-left">New tags</th>
              </tr>
            </thead>
            <tbody className="align-top">
              {Object.keys(updateInfo.newTagObjects).map((k) => (
                <tr key={k} className="even:bg-zinc-50">
                  <td className="p-2">{k}</td>
                  <td className="p-2">
                    {updateInfo.newTagObjects[k]?.newTags.map((nt: string) => (
                      <div key={nt}>{nt}</div>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div id="manual-updating-tags" className="mt-4">
          <h3 className="text-sm font-medium text-zinc-600">Required manual updating</h3>
          {Object.keys(updateInfo.newTagsManualCandidates).map((k) => (
            <div key={k}>{k}</div>
          ))}
        </div>
      </DialogBody>
      <DialogActions>
        <Button
          onClick={() => {
            props.onUpdate()
            props.onClose()
          }}
        >
          Update tags
        </Button>
      </DialogActions>
    </Dialog>
  )
}
