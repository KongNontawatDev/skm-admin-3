import type { KnipConfig } from 'knip'

const config: KnipConfig = {
  ignore: [
    'dist/**',
    'src/components/ui/**',
    'src/components/layout/app-title.tsx',
    'src/tanstack-table.d.ts',
  ],
  ignoreDependencies: [
    '@radix-ui/react-checkbox',
    '@radix-ui/react-icons',
    '@radix-ui/react-popover',
    '@radix-ui/react-tabs',
    '@tanstack/react-table',
    '@tiptap/extension-bubble-menu',
    'date-fns',
    'input-otp',
    'react-day-picker',
    '@faker-js/faker',
  ],
}

export default config
