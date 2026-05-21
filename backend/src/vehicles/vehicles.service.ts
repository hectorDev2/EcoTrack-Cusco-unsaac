import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';

@Injectable()
export class VehiclesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateVehicleDto) {
    return this.prisma.vehicle.create({
      data: {
        plate: dto.plate,
        brand: dto.brand ?? null,
        model: dto.model ?? null,
        capacity: dto.capacity ?? null,
        driverId: dto.driverId ?? null,
        createdAt: new Date().toISOString(),
      },
      include: { driver: { select: { id: true, fullName: true, email: true } } },
    });
  }

  async findAll() {
    return this.prisma.vehicle.findMany({
      include: { driver: { select: { id: true, fullName: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
      include: { driver: { select: { id: true, fullName: true, email: true } } },
    });
    if (!vehicle) throw new NotFoundException('Vehículo no encontrado');
    return vehicle;
  }

  async update(id: string, dto: UpdateVehicleDto) {
    await this.findOne(id);
    return this.prisma.vehicle.update({
      where: { id },
      data: dto,
      include: { driver: { select: { id: true, fullName: true, email: true } } },
    });
  }

  async deactivate(id: string) {
    await this.findOne(id);
    return this.prisma.vehicle.update({
      where: { id },
      data: { status: 'INACTIVE' },
      include: { driver: { select: { id: true, fullName: true, email: true } } },
    });
  }
}
