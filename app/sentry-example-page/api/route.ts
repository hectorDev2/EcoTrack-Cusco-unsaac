import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    throw new Error(
      "Error de prueba desde el servidor — puedes eliminar esta página"
    );
  } catch (e) {
    Sentry.captureException(e);
    return NextResponse.json({
      message: "Error de servidor enviado a Sentry ✓ — revisá tu dashboard en sentry.io/issues",
    });
  }
}
