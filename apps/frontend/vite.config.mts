/// <reference types='vitest' />
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { nxCopyAssetsPlugin } from '@nx/vite/plugins/nx-copy-assets.plugin';

export default defineConfig(() => {
  const frontendPort = Number(process.env.GENTRIX_FRONTEND_PORT ?? 4200);
  const frontendHost = process.env.GENTRIX_FRONTEND_HOST ?? 'localhost';
  const backendProxyTarget =
    process.env.GENTRIX_BACKEND_PROXY_TARGET ?? 'http://localhost:3333';
  const usePolling =
    process.env.GENTRIX_FRONTEND_WATCH_POLLING === 'true';

  return {
    root: import.meta.dirname,
    cacheDir: '../../node_modules/.vite/apps/frontend',
    server: {
      port: frontendPort,
      host: frontendHost,
      watch: usePolling
        ? {
            usePolling: true,
            interval: 300,
          }
        : undefined,
      proxy: {
        '/api': {
          target: backendProxyTarget,
          changeOrigin: true,
        },
        '/health': {
          target: backendProxyTarget,
          changeOrigin: true,
        },
        '/snapshot': {
          target: backendProxyTarget,
          changeOrigin: true,
        },
      },
    },
    preview: {
      port: frontendPort,
      host: frontendHost,
    },
    plugins: [
      tailwindcss(),
      react(),
      nxViteTsPaths(),
      nxCopyAssetsPlugin(['*.md']),
    ],
    // Uncomment this if you are using workers.
    // worker: {
    //   plugins: () => [ nxViteTsPaths() ],
    // },
    build: {
      outDir: '../../dist/apps/frontend',
      emptyOutDir: true,
      reportCompressedSize: true,
      commonjsOptions: {
        transformMixedEsModules: true,
      },
    },
    define: {
      'import.meta.vitest': undefined,
    },
  };
});
