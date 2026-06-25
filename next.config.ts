import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  /* config options here */
};

export default withSentryConfig(nextConfig, {
  org: "unsaac",
  project: "javascript-nextjs",

  // Token para subir source maps — leer de .env.sentry-build-plugin
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Sube más archivos del cliente para mejor resolución de stack traces
  widenClientFileUpload: true,

  // Proxy para evitar que ad-blockers bloqueen eventos de Sentry
  tunnelRoute: "/monitoring",

  // Suprime output en no-CI
  silent: !process.env.CI,
});
