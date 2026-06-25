import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  debug: true, // ← quitar después de verificar

  sendDefaultPii: true,

  // 100% en desarrollo, 10% en producción
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,

  // Session Replay: 10% de todas las sesiones, 100% de sesiones con errores
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  enableLogs: true,

  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
});

// Captura transiciones de navegación en App Router
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
