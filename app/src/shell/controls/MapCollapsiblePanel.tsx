import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react'
import clsx from 'clsx'
import { ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'

type Props = {
  title: string
  children: ReactNode
  defaultOpen?: boolean
}

/** Floating map chrome panel — closed by default, toggled by click (not hover). */
export function MapCollapsiblePanel({ title, children, defaultOpen = false }: Props) {
  return (
    <Disclosure defaultOpen={defaultOpen}>
      {({ open }: { open: boolean }) => (
        <div className="rounded-lg bg-white/90 text-sm shadow-xs ring-1 ring-zinc-950/5 backdrop-blur-sm">
          <DisclosureButton className="flex w-full cursor-pointer items-center gap-1.5 px-2 py-1 text-left text-zinc-900">
            <ChevronRight
              aria-hidden
              className={clsx(
                'size-4 shrink-0 text-zinc-500 transition-transform',
                open && 'rotate-90',
              )}
            />
            <span className="font-medium">{title}</span>
          </DisclosureButton>
          <DisclosurePanel className="border-t border-zinc-950/5 px-2 py-1.5">
            {children}
          </DisclosurePanel>
        </div>
      )}
    </Disclosure>
  )
}
