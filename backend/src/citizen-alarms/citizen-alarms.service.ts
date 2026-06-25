import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCitizenAlarmDto } from './dto/create-citizen-alarm.dto';

@Injectable()
export class CitizenAlarmsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateCitizenAlarmDto) {
    return this.prisma.citizenAlarm.create({
      data: {
        userId,
        zoneId: dto.zoneId,
        dayOfWeek: dto.dayOfWeek,
        label: dto.label ?? null,
      },
      include: {
        zone: { select: { id: true, name: true } },
      },
    });
  }

  async findByUser(userId: string) {
    return this.prisma.citizenAlarm.findMany({
      where: { userId, active: true },
      include: {
        zone: { select: { id: true, name: true } },
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
