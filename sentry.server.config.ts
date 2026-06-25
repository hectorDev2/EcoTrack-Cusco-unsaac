import * as Sentry from "@sentry/nextjs";

Sentry.init({
  enabled: false,
  dsn: process.env.SENTRY_DSN,

  debug: false,

  sendDefaultPii: true,

  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,

  // Adjunta valores de variables locales al stack frame
  includeLocalVariables: true,

  enableLogs: true,
});
