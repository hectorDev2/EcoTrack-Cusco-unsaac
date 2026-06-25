import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCitizenAlarmDto } from './dto/create-citizen-alarm.dto';

@Injectable()
export class CitizenAlarmsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateCitizenAlarmDto) {
    const data: Record<string, unknown> = {
      userId,
      zoneId: dto.zoneId,
      dayOfWeek: dto.dayOfWeek,
      label: dto.label ?? null,
    };

    if (dto.pickupPointId) {
      const pickupPoint = await this.prisma.pickupPoint.findUnique({
        where: { id: dto.pickupPointId },
      });
      if (!pickupPoint) {
        throw new NotFoundException('Punto de recojo no encontrado');
      }

      const routeStop = await this.prisma.routeStop.findFirst({
        where: { pickupPointId: dto.pickupPointId },
        include: { route: { select: { id: true, name: true } } },
      });

      data.pickupPointId = dto.pickupPointId;
      if (routeStop) {
        data.routeId = routeStop.route.id;
      }
    }

    return this.prisma.citizenAlarm.create({
      data: data as any,
      include: {
        zone: { select: { id: true, name: true } },
        pickupPoint: { select: { id: true, name: true, address: true } },
        route: { select: { id: true, name: true } },
      },
    });
  }

  async findByUser(userId: string) {
    return this.prisma.citizenAlarm.findMany({
      where: { userId, active: true },
      include: {
        zone: { select: { id: true, name: true } },
        pickupPoint: { select: { id: true, name: true, address: true } },
        route: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
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