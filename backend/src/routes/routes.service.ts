import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRouteDto } from './dto/create-route.dto';
import { UpdateRouteDto } from './dto/update-route.dto';

const routeInclude = {
  zone: { select: { id: true, name: true } },
  driver: { select: { id: true, fullName: true, email: true } },
  stops: {
    include: {
      pickupPoint: {
        select: {
          id: true,
          name: true,
          address: true,
          latitude: true,
          longitude: true,
        },
      },
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
      completedStops: route.stops.filter((s) => s.status === 'COMPLETED')
        .length,
    };
  }

  async create(dto: CreateRouteDto) {
    const route = await this.prisma.route.create({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      data: {
        zoneId: dto.zoneId,
        driverId: dto.driverId ?? null,
        name: dto.name ?? null,
        shift: dto.shift ?? null,
        frequency: dto.frequency ?? null,
        status: dto.status ?? 'PENDING',
        createdAt: new Date(),
      } as any,
    });

    if (dto.pickupPointIds && dto.pickupPointIds.length > 0) {
      await this.prisma.routeStop.createMany({
        data: dto.pickupPointIds.map((id, i) => ({
          routeId: route.id,
          pickupPointId: id,
          orderIndex: i,
        })),
      });
    }

    return this.findOne(route.id);
  }

  async update(id: string, dto: UpdateRouteDto) {
    await this.findOne(id);

    const data: Record<string, any> = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.shift !== undefined) data.shift = dto.shift;
    if (dto.frequency !== undefined) data.frequency = dto.frequency;
    if (dto.driverId !== undefined) data.driverId = dto.driverId || null;
    if (dto.status) {
      data.status = dto.status;
      if (dto.status === 'IN_PROGRESS') data.startedAt = new Date();
      if (dto.status === 'COMPLETED') data.finishedAt = new Date();
    }

    await this.prisma.route.update({ where: { id }, data });

    if (dto.pickupPointIds !== undefined) {
      await this.prisma.routeStop.deleteMany({ where: { routeId: id } });
      if (dto.pickupPointIds.length > 0) {
        await this.prisma.routeStop.createMany({
          data: dto.pickupPointIds.map((ppId, i) => ({
            routeId: id,
            pickupPointId: ppId,
            orderIndex: i,
            status: 'PENDING',
          })),
        });
      }
    }

    return this.findOne(id);
  }

  async findActive() {
    return this.prisma.route
      .findMany({
        where: { status: { in: ['PENDING', 'IN_PROGRESS'] } },
        include: {
          zone: { select: { id: true, name: true } },
          stops: {
            include: {
              pickupPoint: {
                select: { id: true, name: true, address: true, latitude: true, longitude: true },
              },
            },
            orderBy: { orderIndex: 'asc' as const },
          },
        },
        orderBy: { createdAt: 'desc' },
      })
      .then(async (routes) => {
        const inProgressIds = routes
          .filter((r) => r.status === 'IN_PROGRESS')
          .map((r) => r.id);

        const latestByRoute = new Map<
          string,
          { latitude: number; longitude: number; recordedAt: Date }
        >();

        if (inProgressIds.length > 0) {
          const locations = await this.prisma.routeLocation.findMany({
            where: { routeId: { in: inProgressIds } },
            orderBy: { recordedAt: 'desc' },
          });
          for (const loc of locations) {
            if (!latestByRoute.has(loc.routeId)) {
              latestByRoute.set(loc.routeId, {
                latitude: loc.latitude,
                longitude: loc.longitude,
                recordedAt: loc.recordedAt,
              });
            }
          }
        }

        return routes.map((r) => ({
          id: r.id,
          name: r.name,
          zone: r.zone,
          status: r.status,
          totalStops: r.stops.length,
          stops: r.stops.map((s) => ({
            id: s.id,
            pickupPoint: s.pickupPoint,
            orderIndex: s.orderIndex,
          })),
          currentLocation: latestByRoute.get(r.id) ?? null,
        }));
      });
  }

  async findByZone(zoneId: string) {
    return this.prisma.route
      .findMany({
        where: { zoneId, status: { in: ['PENDING', 'IN_PROGRESS'] } },
        include: {
          zone: { select: { id: true, name: true } },
          driver: { select: { id: true, fullName: true } },
          stops: {
            include: {
              pickupPoint: {
                select: {
                  id: true,
                  name: true,
                  address: true,
                  latitude: true,
                  longitude: true,
                },
              },
            },
            orderBy: { orderIndex: 'asc' as const },
          },
        },
        orderBy: { createdAt: 'desc' },
      })
      .then((routes) =>
        routes.map((r) => ({
          ...r,
          totalStops: r.stops.length,
          completedStops: r.stops.filter((s) => s.status === 'COMPLETED')
            .length,
        })),
      );
  }

  async findByDriver(driverId: string) {
    return this.prisma.route
      .findMany({
        where: { driverId, status: { in: ['PENDING', 'IN_PROGRESS'] } },
        include: routeInclude,
        orderBy: { createdAt: 'desc' },
      })
      .then((routes) =>
        routes.map((r) => ({
          ...r,
          totalStops: r.stops.length,
          completedStops: r.stops.filter((s) => s.status === 'COMPLETED')
            .length,
        })),
      );
  }

  async startRoute(id: string, driverId: string) {
    const route = await this.findOne(id);
    if (route.driverId !== driverId) {
      throw new ForbiddenException('Esta ruta no te pertenece');
    }
    if (route.status !== 'PENDING') {
      throw new BadRequestException('Solo se pueden iniciar rutas pendientes');
    }
    return this.prisma.route.update({
      where: { id },
      data: { status: 'IN_PROGRESS', startedAt: new Date() },
      include: routeInclude,
    });
  }

  async completeRoute(id: string, driverId: string) {
    const route = await this.findOne(id);
    if (route.driverId !== driverId) {
      throw new ForbiddenException('Esta ruta no te pertenece');
    }
    if (route.status !== 'IN_PROGRESS') {
      throw new BadRequestException(
        'Solo se pueden completar rutas en progreso',
      );
    }
    return this.prisma.route.update({
      where: { id },
      data: { status: 'COMPLETED', finishedAt: new Date() },
      include: routeInclude,
    });
  }

  async completeStop(stopId: string, driverId: string) {
    const stop = await this.prisma.routeStop.findUnique({
      where: { id: stopId },
      include: { route: { select: { driverId: true, status: true } } },
    });
    if (!stop) throw new NotFoundException('Parada no encontrada');
    if (stop.route.driverId !== driverId) {
      throw new ForbiddenException('Esta parada no pertenece a tu ruta');
    }
    if (stop.status === 'COMPLETED') {
      throw new BadRequestException('La parada ya fue completada');
    }
    return this.prisma.routeStop.update({
      where: { id: stopId },
      data: { status: 'COMPLETED' },
    });
  }

  async sendLocation(
    routeId: string,
    driverId: string,
    latitude: number,
    longitude: number,
  ) {
    const route = await this.prisma.route.findUnique({
      where: { id: routeId },
    });
    if (!route) throw new NotFoundException('Ruta no encontrada');
    if (route.driverId !== driverId) {
      throw new ForbiddenException('Esta ruta no te pertenece');
    }
    return this.prisma.routeLocation.create({
      data: { routeId, latitude, longitude },
    });
  }

  async getLocations(routeId: string) {
    return this.prisma.routeLocation.findMany({
      where: { routeId },
      orderBy: { recordedAt: 'asc' },
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
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
        name: (r as any).name ?? `Ruta ${r.zone?.name ?? 'Sin zona'}`,
        zone: r.zone?.name ?? 'Sin zona',
        driver: r.driver?.fullName ?? 'Sin conductor',
        status: r.status,
        progress:
          r.totalStops > 0
            ? Math.round((r.completedStops / r.totalStops) * 100)
            : 0,
        totalStops: r.totalStops,
        completedStops: r.completedStops,
        startedAt: r.startedAt,
        createdAt: r.createdAt,
      })),
    };
  }
}
