import type { ReactNode } from 'react'

export function AccountCalloutBar(props: { message: ReactNode; action: ReactNode }) {
  return (
    <div
      className="flex items-center justify-between gap-3 rounded-sm bg-zinc-950 px-3 py-2.5 text-white"
      role="status"
    >
      {props.message}
      {props.action}
    </div>
  )
}
