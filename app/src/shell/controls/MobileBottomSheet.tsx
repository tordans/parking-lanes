import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import clsx from 'clsx'
import { X } from 'lucide-react'
import { AnimatePresence, motion, useDragControls, type PanInfo } from 'motion/react'
import type { ReactNode } from 'react'

type SheetMapPeek = 'minimal' | '10%' | '20%'

const maxHeightByPeek: Record<SheetMapPeek, string> = {
  minimal: 'max-h-[calc(100dvh-3.5rem)]',
  '10%': 'max-h-[90dvh]',
  '20%': 'max-h-[80dvh]',
}

type Props = {
  open: boolean
  onClose: () => void
  title: ReactNode
  children: ReactNode
  mapPeek?: SheetMapPeek
}

/**
 * Mobile bottom sheet: slides up from the bottom, dismissible via swipe on the
 * header handle, backdrop tap, close button, or Escape. Headless UI Dialog
 * handles a11y; Motion handles slide + drag-to-dismiss.
 */
export function MobileBottomSheet({ open, onClose, title, children, mapPeek = 'minimal' }: Props) {
  const dragControls = useDragControls()
  const maxHeight = maxHeightByPeek[mapPeek]

  return (
    <AnimatePresence>
      {open ? (
        <Dialog static open onClose={onClose} className="relative z-40">
          <motion.div
            className="fixed inset-0 bg-zinc-950/30"
            aria-hidden
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <div className="fixed inset-x-0 bottom-0 flex flex-col items-stretch">
            <div className="flex justify-end px-3 pb-1.5">
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="rounded p-2 text-white drop-shadow-md"
              >
                <X className="size-7" aria-hidden />
              </button>
            </div>
            <motion.div
              className={clsx(
                'flex w-full flex-col overflow-hidden rounded-t-xl bg-white shadow-xl',
                maxHeight,
              )}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 32, stiffness: 320 }}
              drag="y"
              dragControls={dragControls}
              dragListener={false}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.6 }}
              onDragEnd={(_event: PointerEvent, info: PanInfo) => {
                if (info.offset.y > 120 || info.velocity.y > 500) onClose()
              }}
            >
              <DialogPanel className="flex min-h-0 flex-1 flex-col">
                <header
                  onPointerDown={(event) => dragControls.start(event)}
                  className="relative z-10 flex shrink-0 cursor-grab touch-none flex-col py-2.5 select-none after:absolute after:inset-x-0 after:-top-2 after:-bottom-2 after:content-[''] active:cursor-grabbing"
                >
                  <div className="mx-auto h-1.5 w-10 rounded-full bg-zinc-300" />
                  <DialogTitle className="sr-only">{title}</DialogTitle>
                </header>
                <div className="min-h-0 min-w-0 flex-1 overflow-x-clip overflow-y-auto overscroll-contain px-4 pb-[env(safe-area-inset-bottom)] [--panel-section-bleed:1.25rem]">
                  {children}
                </div>
              </DialogPanel>
            </motion.div>
          </div>
        </Dialog>
      ) : null}
    </AnimatePresence>
  )
}
