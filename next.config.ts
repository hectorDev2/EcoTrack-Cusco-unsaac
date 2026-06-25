import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';

const nextConfig: NextConfig = {
  /* config options here */
};

export default withSentryConfig(nextConfig, {
  // DSN para subir source maps a Sentry (solo en build)
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Sube source maps en silencio
  silent: !process.env.CI,

  // Oculta source maps del bundle público
  hideSourceMaps: true,

  // Reduce el tamaño del bundle de Sentry en el cliente
  disableLogger: true,

  // Permite compilar aunque no haya SENTRY_AUTH_TOKEN
  disableClientWebpackPlugin: !process.env.SENTRY_AUTH_TOKEN,
  disableServerWebpackPlugin: !process.env.SENTRY_AUTH_TOKEN,
});
