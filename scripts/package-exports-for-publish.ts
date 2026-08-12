#!/usr/bin/env bun
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const cwd = process.cwd()
const pkgPath = join(cwd, 'package.json')
const backupPath = join(cwd, '.package.json.dev-exports')
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as {
  exports?: unknown
  publishExports?: unknown
}

if (!pkg.publishExports) {
  console.log('No publishExports; leaving package.json exports unchanged')
  process.exit(0)
}

if (!existsSync(backupPath)) {
  writeFileSync(backupPath, JSON.stringify(pkg.exports ?? null, null, 2) + '\n')
}

pkg.exports = pkg.publishExports
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')
console.log('Switched exports to publishExports for pack/publish')
