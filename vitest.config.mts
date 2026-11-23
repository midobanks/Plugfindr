import { defineConfig } from 'vitest/config';

export default defineConfig({
  oxc: {
    jsx: 'react-jsx',
  },
  test: {
    include: ['packages/**/*.test.ts', 'apps/**/*.test.ts', 'apps/**/*.test.tsx'],
    environment: 'node',
  },
});
