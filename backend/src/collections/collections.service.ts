import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCollectionDto } from './dto/create-collection.dto';

@Injectable()
export class CollectionsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCollectionDto, driverId: string) {
    const stop = await this.prisma.routeStop.findUnique({
      where: { id: dto.routeStopId },
      include: { route: { select: { id: true, driverId: true } } },
    });

    if (!stop) throw new NotFoundException('Parada no encontrada');
    if (stop.route.driverId !== driverId) {
      throw new NotFoundException('Esta parada no pertenece a tu ruta');
    }

    const existing = await this.prisma.collection.findUnique({
      where: { routeStopId: dto.routeStopId },
    });
    if (existing) {
      throw new ConflictException(
        'Esta parada ya tiene una recolección registrada',
      );
    }

    // Registrar la recolección marca la parada como completada en el mismo
    // paso — antes quedaban desincronizadas (el registro se creaba pero
    // RouteStop.status se quedaba en PENDING para siempre), lo que además
    // impedía saber cuándo el conductor había terminado toda la ruta.
    const [collection] = await this.prisma.$transaction([
      this.prisma.collection.create({
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
      }),
      this.prisma.routeStop.update({
        where: { id: dto.routeStopId },
        data: { status: 'COMPLETED' },
      }),
    ]);

    // Si esa era la última parada pendiente, la ruta se completa sola — el
    // conductor no debería tener que tocar un botón aparte para cerrarla.
    const pendingCount = await this.prisma.routeStop.count({
      where: { routeId: stop.route.id, status: { not: 'COMPLETED' } },
    });
    if (pendingCount === 0) {
      await this.prisma.route.updateMany({
        where: { id: stop.route.id, status: 'IN_PROGRESS' },
        data: { status: 'COMPLETED', finishedAt: new Date() },
      });
    }

    return collection;
  }
}
