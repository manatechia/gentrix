import { defineConfig, devices } from '@playwright/test';
import * as path from 'node:path';

const workspaceRoot = process.cwd();
const authStorageStatePath = path.resolve(
  workspaceRoot,
  'dist/apps/frontend-e2e/.auth/user.json',
);

export default defineConfig({
  testDir: '.',
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ['list'],
    [
      'html',
      {
        open: 'never',
        outputFolder: path.resolve(workspaceRoot, 'dist/apps/frontend-e2e/report'),
      },
    ],
  ],
  outputDir: path.resolve(workspaceRoot, 'dist/apps/frontend-e2e/test-results'),
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:4200',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'setup',
      testMatch: /playwright[\\/]auth\.setup\.ts/,
    },
    {
      name: 'desktop-chromium',
      testDir: './tests',
      use: {
        ...devices['Desktop Chrome'],
        storageState: authStorageStatePath,
      },
      dependencies: ['setup'],
    },
    {
      name: 'mobile-chromium',
      testDir: './tests',
      use: {
        ...devices['Pixel 7'],
        storageState: authStorageStatePath,
      },
      dependencies: ['setup'],
    },
  ],
});
