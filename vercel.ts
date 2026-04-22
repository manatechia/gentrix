import {
  deploymentEnv,
  routes,
  type VercelConfig,
} from '@vercel/config/v1';

// Backend URL is resolved per Vercel environment (Production, Preview, Development)
// via the BACKEND_URL project env var. Browser requests hit the same Vercel origin
// and are proxied server-side to this URL, so CORS is not required.
const BACKEND_URL = deploymentEnv('BACKEND_URL');

const securityHeaders = [
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains',
  },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
  {
    key: 'Content-Security-Policy',
    value:
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
  },
];

export const config: VercelConfig = {
  framework: null,
  installCommand: 'pnpm install --frozen-lockfile',
  buildCommand: 'cd apps/frontend && pnpm exec vite build',
  outputDirectory: 'dist/apps/frontend',
  rewrites: [
    routes.rewrite('/api/(.*)', `${BACKEND_URL}/api/$1`),
    routes.rewrite('/(.*)', '/index.html'),
  ],
  headers: [routes.header('/(.*)', securityHeaders)],
};
