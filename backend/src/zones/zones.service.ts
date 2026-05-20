import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateZoneDto } from './dto/create-zone.dto';
import { UpdateZoneDto } from './dto/update-zone.dto';

@Injectable()
export class ZonesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.zone.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findActive() {
    return this.prisma.zone.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const zone = await this.prisma.zone.findUnique({ where: { id } });
    if (!zone) throw new NotFoundException('Zona no encontrada');
    return zone;
  }

  async create(dto: CreateZoneDto) {
    return this.prisma.zone.create({
      data: {
        ...dto,
        createdAt: new Date().toISOString(),
      },
    });
  }

  async update(id: string, dto: UpdateZoneDto) {
    await this.findOne(id);
    return this.prisma.zone.update({ where: { id }, data: dto });
  }

  async deactivate(id: string) {
    await this.findOne(id);
    return this.prisma.zone.update({
      where: { id },
      data: { status: 'INACTIVE' },
    });
  }
}
