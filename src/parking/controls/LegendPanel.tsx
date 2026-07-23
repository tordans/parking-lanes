import { useState } from 'react'
import { legend } from '../legend'

export function LegendPanel() {
  const [shown, setShown] = useState(false)
  const [pinned, setPinned] = useState(false)

  return (
    <div
      className="cursor-pointer rounded-lg bg-white/90 px-2 py-1 text-sm shadow-xs ring-1 ring-zinc-950/5 backdrop-blur-sm"
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
          <div key={x.condition} className="flex items-center gap-2">
            <div className="h-0.5 w-7" style={{ backgroundColor: x.color }} />
            <span>{x.text}</span>
          </div>
        ))
      ) : (
        <span>Legend</span>
      )}
    </div>
  )
}
