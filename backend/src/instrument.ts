import * as Sentry from '@sentry/nestjs';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  integrations: [nodeProfilingIntegration()],

  // Captura el 100% de las trazas en desarrollo; ajusta en producción
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
  profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  environment: process.env.NODE_ENV ?? 'development',

  // No inicializar si no hay DSN configurado
  enabled: false,
});
