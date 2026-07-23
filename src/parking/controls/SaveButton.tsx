import { useChangesCount } from '../app-store'

export function SaveButton(props: { onClick: () => void }) {
  const changesCount = useChangesCount()

  if (!changesCount) return null

  return (
    <button className="save-control" onClick={props.onClick}>
      <img src="./assets/icons/upload.svg" width={16} height={16} />
      <span>
        <span className="save-control_button-text">Save</span>({changesCount})
      </span>
    </button>
  )
}
