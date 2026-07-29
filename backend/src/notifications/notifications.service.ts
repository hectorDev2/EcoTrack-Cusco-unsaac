import { Injectable, Logger } from '@nestjs/common';
// El paquete "twilio" usa `export =` (CommonJS puro); sin esModuleInterop,
// `import twilio from 'twilio'` compila a `twilio_1.default(...)`, que no
// existe. Esta es la forma correcta de importarlo con este tsconfig.
import twilio = require('twilio');
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly client: ReturnType<typeof twilio> | null;
  private readonly fromNumber: string | null;

  constructor(private prisma: PrismaService) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    this.fromNumber = process.env.TWILIO_WHATSAPP_FROM ?? null;

    if (!accountSid || !authToken || !this.fromNumber) {
      this.logger.warn(
        'Twilio no está configurado (TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_WHATSAPP_FROM). Los mensajes de WhatsApp se registrarán en el log, pero no se enviarán.',
      );
      this.client = null;
      return;
    }

    this.client = twilio(accountSid, authToken);
  }

  async sendWhatsapp(
    toPhone: string,
    body: string,
    options?: { userId?: string; referenceId?: string; referenceType?: string },
  ): Promise<boolean> {
    const success = this.client && this.fromNumber
      ? await this.doTwillioSend(toPhone, body)
      : false;

    if (!success) {
      this.logger.log(`[WhatsApp simulado] Para ${toPhone}: ${body}`);
    }

    // Persistir en el log, tanto éxito como fallo
    this.prisma.notificationLog.create({
      data: {
        userId: options?.userId ?? null,
        type: 'whatsapp',
        channel: success ? 'twilio' : 'pending',
        recipient: toPhone,
        status: success ? 'SENT' : 'FAILED',
        message: body,
        referenceId: options?.referenceId ?? null,
        referenceType: options?.referenceType ?? null,
        error: success ? null : 'Twilio no configurado o falló',
        sentAt: new Date(),
      },
    }).catch((err: unknown) => {
      this.logger.warn(`No se pudo persistir log de notificación: ${err instanceof Error ? err.message : err}`);
    });

    return success;
  }

  private async doTwillioSend(toPhone: string, body: string): Promise<boolean> {
    try {
      const message = await this.client!.messages.create({
        from: `whatsapp:${this.fromNumber}`,
        to: `whatsapp:${toPhone}`,
        body,
      });
      this.logger.log(`WhatsApp enviado a ${toPhone} (sid=${message.sid}, status=${message.status})`);
      return true;
    } catch (err) {
      this.logger.error(
        `Error enviando WhatsApp a ${toPhone}: ${err instanceof Error ? err.message : err}`,
      );
      return false;
    }
  }
}
