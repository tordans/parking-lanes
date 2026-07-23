import { defineConfig } from 'oxfmt'

export default defineConfig({
  useTabs: false,
  tabWidth: 2,
  printWidth: 100,
  singleQuote: true,
  jsxSingleQuote: false,
  quoteProps: 'as-needed',
  trailingComma: 'all',
  semi: false,
  arrowParens: 'always',
  bracketSameLine: false,
  bracketSpacing: true,
  endOfLine: 'lf',
  sortImports: {
    newlinesBetween: false,
  },
  sortPackageJson: true,
  ignorePatterns: [
    '.agents/**',
    '.cursor/**',
    'dist/**',
    'src/routeTree.gen.ts',
    'src/parking/interface.ts',
    'src/parking/controls/Legend.tsx',
    'src/parking/controls/AppInfo.tsx',
  ],
})
