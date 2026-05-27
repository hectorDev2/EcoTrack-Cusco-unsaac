import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCollectionDto } from './dto/create-collection.dto';

@Injectable()
export class CollectionsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCollectionDto, driverId: string) {
    const stop = await this.prisma.routeStop.findUnique({
      where: { id: dto.routeStopId },
      include: { route: { select: { driverId: true } } },
    });

    if (!stop) throw new NotFoundException('Parada no encontrada');
    if (stop.route.driverId !== driverId) {
      throw new NotFoundException('Esta parada no pertenece a tu ruta');
    }

    const existing = await this.prisma.collection.findUnique({
      where: { routeStopId: dto.routeStopId },
    });
    if (existing) {
      throw new ConflictException('Esta parada ya tiene una recolección registrada');
    }

    return this.prisma.collection.create({
      data: {
        routeStopId: dto.routeStopId,
        wasteTypeId: dto.wasteTypeId,
        collectedAt: new Date(),
        notes: dto.notes ?? null,
      },
      include: {
        routeStop: {
          include: {
            pickupPoint: { select: { id: true, name: true, address: true } },
          },
        },
        wasteType: { select: { id: true, name: true, category: true } },
      },
    });
  }
}
