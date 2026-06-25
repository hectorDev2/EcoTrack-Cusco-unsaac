import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  environment: process.env.NODE_ENV ?? 'development',

  // Captura el 100% de las sesiones en desarrollo; reduce en producción
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,

  // Muestra el diálogo de reporte al usuario cuando ocurre un error
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,

  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
});
