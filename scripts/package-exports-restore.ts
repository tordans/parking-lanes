#!/usr/bin/env bun
import { readFileSync, writeFileSync, existsSync, unlinkSync } from 'node:fs'
import { join } from 'node:path'

const cwd = process.cwd()
const pkgPath = join(cwd, 'package.json')
const backupPath = join(cwd, '.package.json.dev-exports')
if (!existsSync(backupPath)) process.exit(0)

const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as { exports?: unknown }
pkg.exports = JSON.parse(readFileSync(backupPath, 'utf8'))
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')
unlinkSync(backupPath)
console.log('Restored development exports')
