import { defineConfig } from 'vitest/config';

import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';

export default defineConfig({
  plugins: [nxViteTsPaths()],
  test: {
    environment: 'node',
    include: [
      'apps/backend/src/**/*.spec.ts',
      'apps/frontend/src/**/*.spec.ts',
      'libs/**/*.spec.ts',
    ],
  },
});
