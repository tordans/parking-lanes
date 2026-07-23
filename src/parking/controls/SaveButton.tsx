import { Button } from '../../components/catalyst/button'
import { assetUrl } from '../../utils/asset-url'
import { useChangesCount } from '../app-store'

export function SaveButton(props: { onClick: () => void }) {
  const changesCount = useChangesCount()

  if (!changesCount) return null

  return (
    <Button color="yellow" onClick={props.onClick}>
      <img
        data-slot="icon"
        src={assetUrl('assets/icons/upload.svg')}
        width={16}
        height={16}
        alt=""
      />
      <span>
        <span className="max-sm:hidden">Save</span>({changesCount})
      </span>
    </Button>
  )
}
