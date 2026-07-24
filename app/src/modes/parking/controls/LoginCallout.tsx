import { TriangleAlert } from 'lucide-react'
import { Button } from '../../../components/catalyst/button'

/** Tailwind UI–style warning callout (Alerts with description + action). */
export function LoginCallout(props: { onLogin: () => void }) {
  return (
    <div className="rounded-md bg-yellow-50 p-4" role="status">
      <div className="flex">
        <div className="shrink-0">
          <TriangleAlert aria-hidden className="size-5 text-yellow-400" />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-yellow-800">Log in required</h3>
          <div className="mt-2 text-sm text-yellow-700">
            <p className="m-0">Log in to save edits to OpenStreetMap.</p>
          </div>
          <div className="mt-4">
            <div className="-mx-2 -my-1.5 flex">
              <Button
                plain
                className="rounded-md bg-yellow-50 px-2 py-1.5 text-sm font-medium text-yellow-800 hover:bg-yellow-100"
                onClick={props.onLogin}
              >
                Log in
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
