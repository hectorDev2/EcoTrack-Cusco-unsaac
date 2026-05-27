import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';

@Injectable()
export class CollectionSchedulesService {
  constructor(private prisma: PrismaService) {}

  async findAll(zoneId?: string, wasteTypeId?: string, page = 1, limit = 10) {
    const where: any = { status: 'ACTIVE' };
    if (zoneId) where.zoneId = zoneId;
    if (wasteTypeId) where.wasteTypeId = wasteTypeId;

    const [data, total] = await Promise.all([
      this.prisma.collectionSchedule.findMany({
        where,
        include: {
          zone: { select: { id: true, name: true } },
          wasteType: { select: { id: true, name: true, category: true } },
        },
        orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.collectionSchedule.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const schedule = await this.prisma.collectionSchedule.findFirst({
      where: { id, status: 'ACTIVE' },
      include: {
        zone: { select: { id: true, name: true } },
        wasteType: { select: { id: true, name: true, category: true } },
      },
    });
    if (!schedule) throw new NotFoundException('Horario no encontrado');
    return schedule;
  }

  async create(dto: CreateScheduleDto) {
    return this.prisma.collectionSchedule.create({
      data: dto,
      include: {
        zone: { select: { id: true, name: true } },
        wasteType: { select: { id: true, name: true, category: true } },
      },
    });
  }

  async update(id: string, dto: UpdateScheduleDto) {
    await this.findOne(id);
    return this.prisma.collectionSchedule.update({
      where: { id },
      data: dto,
      include: {
        zone: { select: { id: true, name: true } },
        wasteType: { select: { id: true, name: true, category: true } },
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.collectionSchedule.update({
      where: { id },
      data: { status: 'INACTIVE' },
    });
  }
}
