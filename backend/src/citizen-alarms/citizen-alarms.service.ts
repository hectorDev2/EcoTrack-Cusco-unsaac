import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCitizenAlarmDto } from './dto/create-citizen-alarm.dto';

@Injectable()
export class CitizenAlarmsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateCitizenAlarmDto) {
    const route = await this.prisma.route.findUnique({
      where: { id: dto.routeId },
      include: {
        stops: {
          where: { pickupPointId: dto.pickupPointId },
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

    return this.prisma.citizenAlarm.create({
      data: {
        userId,
        routeId: dto.routeId,
        pickupPointId: dto.pickupPointId,
        notifyBeforeMinutes: dto.notifyBeforeMinutes ?? 30,
        label: dto.label ?? null,
      },
      include: {
        route: { select: { id: true, name: true, status: true, frequency: true } },
        pickupPoint: {
          select: { id: true, name: true, address: true, scheduledTime: true },
        },
      },
    });
  }

  async findByUser(userId: string) {
    return this.prisma.citizenAlarm.findMany({
      where: { userId, active: true },
      include: {
        route: { select: { id: true, name: true, status: true, frequency: true } },
        pickupPoint: {
          select: { id: true, name: true, address: true, scheduledTime: true },
        },
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