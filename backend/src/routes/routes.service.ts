import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRouteDto } from './dto/create-route.dto';
import { UpdateRouteDto } from './dto/update-route.dto';

const routeInclude = {
  zone: { select: { id: true, name: true } },
  driver: { select: { id: true, fullName: true, email: true } },
  stops: {
    include: {
      pickupPoint: { select: { id: true, name: true, address: true, latitude: true, longitude: true } },
    },
    orderBy: { orderIndex: 'asc' as const },
  },
};

@Injectable()
export class RoutesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const routes = await this.prisma.route.findMany({
      include: routeInclude,
      orderBy: { createdAt: 'desc' },
    });

    return routes.map((r) => ({
      ...r,
      totalStops: r.stops.length,
      completedStops: r.stops.filter((s) => s.status === 'COMPLETED').length,
    }));
  }

  async findOne(id: string) {
    const route = await this.prisma.route.findUnique({
      where: { id },
      include: routeInclude,
    });

    if (!route) throw new NotFoundException('Ruta no encontrada');

    return {
      ...route,
      totalStops: route.stops.length,
      completedStops: route.stops.filter((s) => s.status === 'COMPLETED').length,
    };
  }

  async create(dto: CreateRouteDto) {
    return this.prisma.route.create({
      data: {
        zoneId: dto.zoneId,
        driverId: dto.driverId,
        status: dto.status ?? 'PENDING',
        createdAt: new Date().toISOString(),
      },
      include: routeInclude,
    });
  }

  async update(id: string, dto: UpdateRouteDto) {
    await this.findOne(id);

    const data: Record<string, string> = {};
    if (dto.status) data.status = dto.status;
    if (dto.status === 'IN_PROGRESS') data.startedAt = new Date().toISOString();
    if (dto.status === 'COMPLETED') data.finishedAt = new Date().toISOString();

    return this.prisma.route.update({
      where: { id },
      data,
      include: routeInclude,
    });
  }

  async getFleetOverview() {
    const routes = await this.findAll();
    const totalRoutes = routes.length;
    const inTransit = routes.filter((r) => r.status === 'IN_PROGRESS').length;
    const pending = routes.filter((r) => r.status === 'PENDING').length;
    const completed = routes.filter((r) => r.status === 'COMPLETED').length;
    const alerts = routes.filter((r) => r.status === 'CANCELLED').length;

    return {
      totalRoutes,
      inTransit,
      pending,
      completed,
      alerts,
      routes: routes.map((r) => ({
        id: r.id,
        name: `Ruta ${r.zone?.name ?? 'Sin zona'}`,
        zone: r.zone?.name ?? 'Sin zona',
        driver: r.driver?.fullName ?? 'Sin conductor',
        status: r.status,
        progress: r.totalStops > 0 ? Math.round((r.completedStops / r.totalStops) * 100) : 0,
        totalStops: r.totalStops,
        completedStops: r.completedStops,
        startedAt: r.startedAt,
        createdAt: r.createdAt,
      })),
    };
  }
}
