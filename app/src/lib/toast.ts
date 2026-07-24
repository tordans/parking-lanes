import { toast as sonnerToast } from 'sonner'

function messageFromUnknown(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return 'Something went wrong'
}

export const toast = {
  error(message: string) {
    sonnerToast.error(message)
  },
  fromError(error: unknown, fallback = 'Something went wrong') {
    sonnerToast.error(messageFromUnknown(error) || fallback)
  },
}
