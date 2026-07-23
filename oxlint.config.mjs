import { defineConfig } from 'oxlint'
import reactHooksJs from 'oxlint-config-react-hooks-js/configs/recommended-latest.json' with { type: 'json' }

export default defineConfig({
  plugins: ['eslint', 'typescript', 'unicorn', 'oxc', 'react'],
  options: { typeAware: false },
  ignorePatterns: [
    '.agents/**',
    '.cursor/**',
    'dist/**',
    'src/routeTree.gen.ts',
    'src/parking/interface.ts',
    'src/parking/controls/Legend.tsx',
    'src/parking/controls/AppInfo.tsx',
  ],
  rules: {
    'typescript/switch-exhaustiveness-check': 'error',
  },
  overrides: [
    {
      files: ['**/*.test.ts', '**/*.test.tsx'],
      rules: {
        'typescript/no-non-null-assertion': 'off',
        'react/rules-of-hooks': 'off',
      },
    },
    {
      files: ['**/*.tsx'],
      jsPlugins: [{ name: 'react-hooks-js', specifier: 'eslint-plugin-react-hooks' }],
      rules: {
        ...reactHooksJs.rules,
        'react/react-compiler': 'error',
      },
    },
  ],
})
