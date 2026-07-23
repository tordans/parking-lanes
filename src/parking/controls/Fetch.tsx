import { useState } from 'react'
import { OsmDataSource } from '../../utils/types/osm-data'
import { useAppActions, useFetchButtonText, useOsmDataSource } from '../app-store'

export function FetchButton(props: { onClick: () => void }) {
  const [sourcesShown, setSourcesShown] = useState(false)
  const fetchButtonText = useFetchButtonText()
  const dataSource = useOsmDataSource()
  const { setOsmDataSource } = useAppActions()

  return (
    <div
      className={`fetch-control ${sourcesShown ? 'opened' : ''}`}
      tabIndex={-1}
      onBlur={() => setSourcesShown(false)}
    >
      <div className="control-bigfont control-button">
        <div className="fetch-control_wrapper">
          <button className="fetch-control_button" onClick={props.onClick}>
            <img src="./assets/icons/download.svg" width={16} height={16} />
            <span className="fetch-control_button-text">{fetchButtonText}</span>
          </button>
          <div className="fetch-control_toggle" onClick={() => setSourcesShown(!sourcesShown)} />
        </div>
      </div>
      {sourcesShown && (
        <Sources
          source={dataSource}
          onChangeSource={(source) => {
            setSourcesShown(false)
            setOsmDataSource(source)
          }}
        />
      )}
    </div>
  )
}

function Sources(props: {
  source: OsmDataSource
  onChangeSource: (source: OsmDataSource) => void
}) {
  const sources = [
    { source: OsmDataSource.OverpassDe, label: 'overpass-turbo' },
    { source: OsmDataSource.OsmOrg, label: 'osm.org' },
    { source: OsmDataSource.OverpassVk, label: 'overpass-vk' },
  ]
  const items = sources.map((x) => (
    <div
      key={x.source}
      data-value={x.source}
      className={`fetch-control_item ${x.source === props.source ? 'fetch-control_item--selected' : ''}`}
      onClick={() => props.onChangeSource(x.source)}
    >
      From {x.label}
    </div>
  ))

  return <div className="fetch-control_items">{items}</div>
}
