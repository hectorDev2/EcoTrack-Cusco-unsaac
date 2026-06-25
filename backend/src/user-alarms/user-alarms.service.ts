import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserAlarmDto } from './dto/create-user-alarm.dto';
import { UpdateUserAlarmDto } from './dto/update-user-alarm.dto';

const alarmInclude = {
  pickupPoint: { select: { id: true, name: true, address: true } },
  route: { select: { id: true, name: true, zone: { select: { id: true, name: true } } } },
};

@Injectable()
export class UserAlarmsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateUserAlarmDto, userId: string) {
    return this.prisma.userAlarm.create({
      data: {
        userId,
        pickupPointId: dto.pickupPointId,
        routeId: dto.routeId,
        title: dto.title,
        notifyBeforeMinutes: dto.notifyBeforeMinutes,
        enabled: dto.enabled ?? true,
      },
      include: alarmInclude,
    });
  }

  async findByUser(userId: string) {
    return this.prisma.userAlarm.findMany({
      where: { userId },
      include: alarmInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    const alarm = await this.prisma.userAlarm.findFirst({
      where: { id, userId },
      include: alarmInclude,
    });
    if (!alarm) throw new NotFoundException('Alarma no encontrada');
    return alarm;
  }

  async update(id: string, dto: UpdateUserAlarmDto, userId: string) {
    await this.findOne(id, userId);
    return this.prisma.userAlarm.update({
      where: { id },
      data: dto,
      include: alarmInclude,
    });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);
    return this.prisma.userAlarm.delete({ where: { id } });
  }
}
