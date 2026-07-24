import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import type { ReactNode } from 'react'

type Props = {
  title: string
  open: boolean
  onClose: () => void
  children: ReactNode
}

export function MapMobileSidePanel({ title, open, onClose, children }: Props) {
  return (
    <AnimatePresence>
      {open ? (
        <Dialog static open onClose={onClose} className="relative z-40 lg:hidden">
          <motion.div
            className="pointer-events-auto fixed inset-0 bg-zinc-950/25"
            aria-hidden
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <div className="pointer-events-none fixed inset-y-0 left-0 flex">
            <motion.aside
              className="pointer-events-auto flex h-full w-80 max-w-[min(20rem,85vw)] flex-col overflow-hidden bg-white shadow-xl"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 32, stiffness: 320 }}
            >
              <DialogPanel className="flex min-h-0 flex-1 flex-col">
                <header className="flex shrink-0 items-center justify-between gap-2 border-b border-zinc-950/10 px-3 py-2.5 pt-[calc(env(safe-area-inset-top)+0.625rem)]">
                  <DialogTitle className="text-sm font-semibold text-zinc-900">{title}</DialogTitle>
                  <button
                    type="button"
                    className="flex size-8 cursor-pointer items-center justify-center rounded-md text-zinc-600 hover:bg-zinc-950/5"
                    aria-label="Close"
                    onClick={onClose}
                  >
                    <X className="size-5" aria-hidden />
                  </button>
                </header>
                <div className="min-h-0 flex-1 overflow-auto p-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
                  {children}
                </div>
              </DialogPanel>
            </motion.aside>
          </div>
        </Dialog>
      ) : null}
    </AnimatePresence>
  )
}
