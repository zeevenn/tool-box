import { antfu } from '@antfu/eslint-config'

export default antfu({
  type: 'app',
  react: true,
  typescript: true,
  rules: {
    'pnpm/json-valid-catalog': 'off',
    'test/no-import-node-test': 'off',
    // Allow exporting variants/hooks alongside components (common pattern for shadcn/ui)
    'react-refresh/only-export-components': ['warn', { allowExportNames: ['buttonVariants', 'typographyVariants'] }],
  },
}, {
  // Disable react-refresh for barrel exports and context providers
  files: ['**/index.ts', '**/index.tsx', '**/context/**', '**/*-provider.tsx'],
  rules: {
    'react-refresh/only-export-components': 'off',
    // Allow setState in useEffect for theme/system state sync
    'react-hooks-extra/no-direct-set-state-in-use-effect': 'off',
  },
})
