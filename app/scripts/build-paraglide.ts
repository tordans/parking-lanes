/**
 * Serialize paraglide compiles so parallel `pretype-check` / `pretest-run`
 * (via root `check-ci`) do not race on deleting `app/paraglide`.
 */
import { mkdir, rm } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const lockDir = path.join(appRoot, '.paraglide-compile.lock')

async function acquireLock(retries = 200): Promise<void> {
  for (let i = 0; i < retries; i++) {
    try {
      await mkdir(lockDir)
      return
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code
      if (code !== 'EEXIST') throw error
      await Bun.sleep(50)
    }
  }
  throw new Error('Timed out waiting for paraglide compile lock')
}

await acquireLock()
try {
  const proc = Bun.spawn(
    [
      'bunx',
      'paraglide-js',
      'compile',
      '--project',
      './project.inlang',
      '--outdir',
      './paraglide',
      '--strategy',
      'localStorage',
      'baseLocale',
    ],
    { cwd: appRoot, stdout: 'inherit', stderr: 'inherit' },
  )
  const code = await proc.exited
  if (code !== 0) process.exit(code)
} finally {
  await rm(lockDir, { recursive: true, force: true })
}
