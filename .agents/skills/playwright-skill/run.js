#!/usr/bin/env bun
/**
 * Universal Playwright Executor for Claude Code
 *
 * Executes Playwright automation code from:
 * - File path: bun run.js script.js
 * - Inline code: bun run.js 'await page.goto("...")'
 * - Stdin: cat script.js | bun run.js
 *
 * Ensures proper module resolution by running from skill directory.
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

// Change to skill directory for proper module resolution
process.chdir(__dirname)

/**
 * Check if Playwright is installed
 */
function checkPlaywrightInstalled() {
  try {
    require.resolve('playwright')
    return true
  } catch (e) {
    return false
  }
}

/**
 * Install Playwright if missing
 */
function installPlaywright() {
  console.log('📦 Playwright not found. Installing...')
  try {
    execSync('bun install', { stdio: 'inherit', cwd: __dirname })
    execSync('bunx playwright install chromium', { stdio: 'inherit', cwd: __dirname })
    console.log('✅ Playwright installed successfully')
    return true
  } catch (e) {
    console.error('❌ Failed to install Playwright:', e.message)
    console.error('Please run manually: cd', __dirname, '&& bun run setup')
    return false
  }
}

/**
 * Get code to execute from various sources
 */
function getCodeToExecute() {
  const args = process.argv.slice(2)

  // Case 1: File path provided
  if (args.length > 0 && fs.existsSync(args[0])) {
    const filePath = path.resolve(args[0])
    console.log(`📄 Executing file: ${filePath}`)
    return fs.readFileSync(filePath, 'utf8')
  }

  // Case 2: Inline code provided as argument
  if (args.length > 0) {
    console.log('⚡ Executing inline code')
    return args.join(' ')
  }

  // Case 3: Code from stdin
  if (!process.stdin.isTTY) {
    console.log('📥 Reading from stdin')
    return fs.readFileSync(0, 'utf8')
  }

  // No input
  console.error('❌ No code to execute')
  console.error('Usage:')
  console.error('  bun run.js script.js          # Execute file')
  console.error('  bun run.js "code here"        # Execute inline')
  console.error('  cat script.js | bun run.js    # Execute from stdin')
  process.exit(1)
}

/**
 * Clean up old temporary execution files from previous runs
 */
function cleanupOldTempFiles() {
  try {
    const files = fs.readdirSync(__dirname)
    const tempFiles = files.filter((f) => f.startsWith('.temp-execution-') && f.endsWith('.js'))

    if (tempFiles.length > 0) {
      tempFiles.forEach((file) => {
        const filePath = path.join(__dirname, file)
        try {
          fs.unlinkSync(filePath)
        } catch (e) {
          // Ignore errors - file might be in use or already deleted
        }
      })
    }
  } catch (e) {
    // Ignore directory read errors
  }
}

/**
 * Wrap code in an async IIFE and export its promise so main() can await completion.
 */
function wrapCodeIfNeeded(code) {
  // Check if code already has require() and async structure
  const hasRequire = code.includes('require(')
  const hasAsyncIIFE = code.includes('(async () => {') || code.includes('(async()=>{')

  // Already a complete script: export the IIFE promise when it isn't already the runner export
  if (hasRequire && hasAsyncIIFE) {
    if (/module\.exports\s*=\s*\(async\s*\(/.test(code)) {
      return code
    }
    return code.replace(/\(async\s*\(\s*\)\s*=>\s*\{/, 'module.exports = (async () => {')
  }

  // If it's just Playwright commands, wrap in full template
  if (!hasRequire) {
    return `
const { chromium, firefox, webkit, devices } = require('playwright');
const helpers = require('./lib/helpers');

// Extra headers from environment variables (if configured)
const __extraHeaders = helpers.getExtraHeadersFromEnv();

/**
 * Utility to merge environment headers into context options.
 * Use when creating contexts with raw Playwright API instead of helpers.createContext().
 * @param {Object} options - Context options
 * @returns {Object} Options with extraHTTPHeaders merged in
 */
function getContextOptionsWithHeaders(options = {}) {
  if (!__extraHeaders) return options;
  return {
    ...options,
    extraHTTPHeaders: {
      ...__extraHeaders,
      ...(options.extraHTTPHeaders || {})
    }
  };
}

module.exports = (async () => {
  try {
    ${code}
  } catch (error) {
    console.error('❌ Automation error:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
})();
`
  }

  // If has require but no async wrapper
  if (!hasAsyncIIFE) {
    return `
module.exports = (async () => {
  try {
    ${code}
  } catch (error) {
    console.error('❌ Automation error:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
})();
`
  }

  return code
}

/**
 * Main execution
 */
async function main() {
  console.log('🎭 Playwright Skill - Universal Executor\n')

  // Clean up old temp files from previous runs
  cleanupOldTempFiles()

  // Check Playwright installation
  if (!checkPlaywrightInstalled()) {
    const installed = installPlaywright()
    if (!installed) {
      process.exit(1)
    }
  }

  // Get code to execute
  const rawCode = getCodeToExecute()
  const code = wrapCodeIfNeeded(rawCode)

  // Create temporary file for execution
  const tempFile = path.join(__dirname, `.temp-execution-${Date.now()}.js`)

  try {
    // Write code to temp file
    fs.writeFileSync(tempFile, code, 'utf8')

    // Execute the code and await the exported promise so we don't exit early
    console.log('🚀 Starting automation...\n')
    const result = require(tempFile)
    if (result != null && typeof result.then === 'function') {
      await result
    }
  } catch (error) {
    console.error('❌ Execution failed:', error.message)
    if (error.stack) {
      console.error('\n📋 Stack trace:')
      console.error(error.stack)
    }
    process.exit(1)
  } finally {
    try {
      fs.unlinkSync(tempFile)
    } catch {
      // Ignore cleanup errors (file may already be gone)
    }
  }
}

// Run main function
main().catch((error) => {
  console.error('❌ Fatal error:', error.message)
  process.exit(1)
})
