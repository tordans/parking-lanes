import { useState } from 'react'
import { legend } from '../legend'

export function LegendPanel() {
  const [shown, setShown] = useState(false)
  const [pinned, setPinned] = useState(false)

  return (
    <div
      className="leaflet-control-layers control-padding control-bigfont"
      onMouseEnter={() => !pinned && setShown(true)}
      onMouseLeave={() => !pinned && setShown(false)}
      onClick={() => {
        if (pinned) setShown(false)
        else setShown(true)
        setPinned(!pinned)
      }}
    >
      {shown ? (
        legend.map((x) => (
          <div key={x.condition} className="legend__element">
            <div className="legend__line" style={{ backgroundColor: x.color }} />
            <span>{x.text}</span>
          </div>
        ))
      ) : (
        <span>Legend</span>
      )}
    </div>
  )
}
