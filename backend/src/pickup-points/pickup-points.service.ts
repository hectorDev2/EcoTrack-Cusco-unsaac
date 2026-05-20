import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePickupPointDto } from './dto/create-pickup-point.dto';
import { UpdatePickupPointDto } from './dto/update-pickup-point.dto';

@Injectable()
export class PickupPointsService {
  constructor(private prisma: PrismaService) {}

  async findAll(zoneId?: string) {
    const where: any = { status: 'ACTIVE' };
    if (zoneId) where.zoneId = zoneId;

    return this.prisma.pickupPoint.findMany({
      where,
      include: { zone: { select: { id: true, name: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const point = await this.prisma.pickupPoint.findUnique({
      where: { id },
      include: { zone: { select: { id: true, name: true } } },
    });
    if (!point) throw new NotFoundException('Punto de recojo no encontrado');
    return point;
  }

  async create(dto: CreatePickupPointDto) {
    return this.prisma.pickupPoint.create({
      data: dto,
      include: { zone: { select: { id: true, name: true } } },
    });
  }

  async update(id: string, dto: UpdatePickupPointDto) {
    await this.findOne(id);
    return this.prisma.pickupPoint.update({
      where: { id },
      data: dto,
      include: { zone: { select: { id: true, name: true } } },
    });
  }

  async deactivate(id: string) {
    await this.findOne(id);
    return this.prisma.pickupPoint.update({
      where: { id },
      data: { status: 'INACTIVE' },
    });
  }
}
