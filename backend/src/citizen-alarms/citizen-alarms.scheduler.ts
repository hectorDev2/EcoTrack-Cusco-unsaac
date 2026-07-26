import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

const DAY_CODES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

// Días en que corre cada frecuencia del rutero (ver enum FrequencyCode).
// Si una ruta no tiene frequency asignada, se asume que corre todos los días.
const FREQUENCY_DAYS: Record<string, string[]> = {
  LMV: ['MON', 'WED', 'FRI'],
  MJS: ['TUE', 'THU', 'SAT'],
  DOM: ['SUN'],
  DOM_LUN: ['SUN', 'MON'],
  TODOS: DAY_CODES,
};

function runsToday(frequency: string | null, todayCode: string): boolean {
  if (!frequency) return true;
  const days = FREQUENCY_DAYS[frequency];
  if (!days) return true;
  return days.includes(todayCode);
}

function toMinutes(hhmm: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(hhmm);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

@Injectable()
export class CitizenAlarmsScheduler {
  private readonly logger = new Logger(CitizenAlarmsScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async checkAlarms() {
    const now = new Date();
    const todayCode = DAY_CODES[now.getDay()];
    const todayStr = now.toISOString().slice(0, 10);
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    const alarms = await this.prisma.citizenAlarm.findMany({
      where: {
        active: true,
        // OR explícito: en SQL, "NOT (last_notified_date = 'hoy')" excluye las
        // filas con last_notified_date NULL (comparación de tres valores), así
        // que una alarma recién creada nunca calificaría con NOT: { ... }.
        OR: [{ lastNotifiedDate: null }, { lastNotifiedDate: { not: todayStr } }],
      },
      include: {
        user: { select: { id: true, phone: true } },
        route: { select: { id: true, frequency: true } },
        pickupPoint: { select: { id: true, name: true, scheduledTime: true } },
      },
    });

    for (const alarm of alarms) {
      if (!alarm.pickupPoint.scheduledTime) continue;
      if (!runsToday(alarm.route.frequency, todayCode)) continue;

      const scheduledMinutes = toMinutes(alarm.pickupPoint.scheduledTime);
      if (scheduledMinutes == null) continue;

      const triggerMinutes = scheduledMinutes - alarm.notifyBeforeMinutes;

      // Dispara desde el minuto de aviso hasta la hora programada del punto
      // (ventana amplia por si el proceso estuvo caído justo en el minuto exacto).
      if (nowMinutes < triggerMinutes || nowMinutes > scheduledMinutes) continue;

      if (alarm.user.phone) {
        const message = `🚛 Eco Track Wanchaq: tu camión recolector pasará por "${alarm.pickupPoint.name}" en aprox. ${alarm.notifyBeforeMinutes} min (hora estimada ${alarm.pickupPoint.scheduledTime}).`;
        await this.notifications.sendWhatsapp(alarm.user.phone, message);
      } else {
        this.logger.debug(
          `Alarma ${alarm.id}: usuario sin teléfono registrado, no se envió WhatsApp.`,
        );
      }

      await this.prisma.citizenAlarm.update({
        where: { id: alarm.id },
        data: { lastNotifiedDate: todayStr },
      });
    }
  }
}
