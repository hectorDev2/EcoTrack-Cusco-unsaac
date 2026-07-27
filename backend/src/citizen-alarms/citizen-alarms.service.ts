import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCitizenAlarmDto } from './dto/create-citizen-alarm.dto';
import { UpdateCitizenAlarmDto } from './dto/update-citizen-alarm.dto';

const alarmInclude = {
  route: { select: { id: true, name: true, status: true, frequency: true } },
  pickupPoint: {
    select: { id: true, name: true, address: true, scheduledTime: true },
  },
};

@Injectable()
export class CitizenAlarmsService {
  constructor(private prisma: PrismaService) {}

  private async assertPickupPointBelongsToRoute(routeId: string, pickupPointId: string) {
    const route = await this.prisma.route.findUnique({
      where: { id: routeId },
      include: {
        stops: {
          where: { pickupPointId },
          take: 1,
        },
      },
    });

    if (!route) {
      throw new NotFoundException('Ruta no encontrada');
    }

    if (route.stops.length === 0) {
      throw new BadRequestException(
        'El punto de recojo no pertenece a esta ruta',
      );
    }
  }

  async create(userId: string, dto: CreateCitizenAlarmDto) {
    await this.assertPickupPointBelongsToRoute(dto.routeId, dto.pickupPointId);

    return this.prisma.citizenAlarm.create({
      data: {
        userId,
        routeId: dto.routeId,
        pickupPointId: dto.pickupPointId,
        notifyBeforeMinutes: dto.notifyBeforeMinutes ?? 30,
        label: dto.label ?? null,
      },
      include: alarmInclude,
    });
  }

  async findByUser(userId: string) {
    return this.prisma.citizenAlarm.findMany({
      where: { userId, active: true },
      include: alarmInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, userId: string, dto: UpdateCitizenAlarmDto) {
    const alarm = await this.prisma.citizenAlarm.findUnique({ where: { id } });
    if (!alarm || alarm.userId !== userId) {
      throw new NotFoundException('Alarma no encontrada');
    }

    const routeId = dto.routeId ?? alarm.routeId;
    const pickupPointId = dto.pickupPointId ?? alarm.pickupPointId;
    if (dto.routeId || dto.pickupPointId) {
      await this.assertPickupPointBelongsToRoute(routeId, pickupPointId);
    }

    const scheduleChanged =
      (dto.routeId && dto.routeId !== alarm.routeId) ||
      (dto.pickupPointId && dto.pickupPointId !== alarm.pickupPointId) ||
      (dto.notifyBeforeMinutes != null && dto.notifyBeforeMinutes !== alarm.notifyBeforeMinutes);

    return this.prisma.citizenAlarm.update({
      where: { id },
      data: {
        routeId,
        pickupPointId,
        notifyBeforeMinutes: dto.notifyBeforeMinutes ?? alarm.notifyBeforeMinutes,
        label: dto.label !== undefined ? dto.label : alarm.label,
        active: dto.active !== undefined ? dto.active : alarm.active,
        // Si cambió ruta/punto/minutos, se resetea para permitir notificar
        // hoy mismo bajo la nueva configuración.
        lastNotifiedDate: scheduleChanged ? null : alarm.lastNotifiedDate,
      },
      include: alarmInclude,
    });
  }

  async remove(id: string, userId: string) {
    const alarm = await this.prisma.citizenAlarm.findUnique({ where: { id } });
    if (!alarm || alarm.userId !== userId) {
      throw new NotFoundException('Alarma no encontrada');
    }
    return this.prisma.citizenAlarm.update({
      where: { id },
      data: { active: false },
    });
  }
}
