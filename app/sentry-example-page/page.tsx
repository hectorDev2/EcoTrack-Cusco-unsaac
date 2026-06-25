"use client";

import * as Sentry from "@sentry/nextjs";
import { useState } from "react";

export default function SentryExamplePage() {
  const [error, setError] = useState<string | null>(null);

  function triggerClientError() {
    try {
      throw new Error("Error de prueba desde el cliente — puedes eliminar esta página");
    } catch (e) {
      Sentry.captureException(e);
      setError("Error enviado a Sentry ✓ — revisá tu dashboard en sentry.io/issues");
    }
  }

  async function triggerServerError() {
    const res = await fetch("/sentry-example-page/api");
    const data = (await res.json()) as { message: string };
    setError(data.message);
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-2xl font-bold">Verificación de Sentry</h1>
      <p className="text-sm text-gray-500 max-w-md text-center">
        Hacé click en los botones para enviar errores de prueba a Sentry.
        Deberían aparecer en{" "}
        <a
          href="https://unsaac.sentry.io/issues/"
          target="_blank"
          rel="noreferrer"
          className="underline text-blue-600"
        >
          sentry.io/issues
        </a>{" "}
        en ~30 segundos.
      </p>

      <div className="flex gap-4 flex-wrap justify-center">
        <button
          onClick={triggerClientError}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
        >
          Lanzar error de cliente
        </button>
        <button
          onClick={() => void triggerServerError()}
          className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition"
        >
          Lanzar error de servidor
        </button>
      </div>

      {error && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded px-4 py-2">
          {error}
        </p>
      )}

      <p className="text-xs text-gray-400 mt-8">
        Eliminá <code>app/sentry-example-page/</code> cuando termines de verificar.
      </p>
    </main>
  );
}
