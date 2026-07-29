import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRouteDto } from './dto/create-route.dto';
import { UpdateRouteDto } from './dto/update-route.dto';
import { RouteScheduleDto } from './dto/route-schedule.dto';
import { DemoStateService } from '../demo/demo-state.service';

// Orden natural de los turnos a lo largo del día — usado para ordenar las
// rutas de un conductor por hora en vez de por fecha de creación.
const SHIFT_ORDER: Record<string, number> = {
  MANANA: 0,
  TARDE: 1,
  NOCHE: 2,
  DOMINICAL: 3,
};

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
  schedules: {
    orderBy: { time: 'asc' as const },
  },
};

/** `RouteSchedule.days` se guarda como CSV ("MON,WED,FRI") — se expone como array. */
function mapSchedule(s: { id: string; days: string; time: string; label: string | null }) {
  return { id: s.id, days: s.days.split(','), time: s.time, label: s.label };
}

function mapRouteSchedules<T extends { schedules: { id: string; days: string; time: string; label: string | null }[] }>(
  route: T,
) {
  return { ...route, schedules: route.schedules.map(mapSchedule) };
}

@Injectable()
export class RoutesService {
  constructor(
    private prisma: PrismaService,
    private demoState: DemoStateService,
  ) {}

  async findAll() {
    const routes = await this.prisma.route.findMany({
      include: routeInclude,
      orderBy: { createdAt: 'desc' },
    });

    // Incluye la última posición conocida de cada ruta en curso — la usa el
    // admin en /vehiculos para poder ver el camión (real o de demo) en el
    // mapa sin tener que loguearse como el conductor.
    const latestByRoute = await this.latestLocationsByRoute(
      routes.filter((r) => r.status === 'IN_PROGRESS').map((r) => r.id),
    );

    return routes.map((r) => ({
      ...mapRouteSchedules(r),
      totalStops: r.stops.length,
      completedStops: r.stops.filter((s) => s.status === 'COMPLETED').length,
      currentLocation: latestByRoute.get(r.id) ?? null,
    }));
  }

  /** Última posición reportada (real o simulada) de cada ruta en `routeIds`. */
  private async latestLocationsByRoute(routeIds: string[]) {
    const latestByRoute = new Map<
      string,
      { latitude: number; longitude: number; recordedAt: Date }
    >();
    if (routeIds.length === 0) return latestByRoute;

    const locations = await this.prisma.routeLocation.findMany({
      where: { routeId: { in: routeIds } },
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
    return latestByRoute;
  }

  async findOne(id: string) {
    const route = await this.prisma.route.findUnique({
      where: { id },
      include: routeInclude,
    });

    if (!route) throw new NotFoundException('Ruta no encontrada');

    return {
      ...mapRouteSchedules(route),
      totalStops: route.stops.length,
      completedStops: route.stops.filter((s) => s.status === 'COMPLETED')
        .length,
    };
  }

  private async replaceSchedules(routeId: string, schedules: RouteScheduleDto[]) {
    await this.prisma.routeSchedule.deleteMany({ where: { routeId } });
    if (schedules.length > 0) {
      await this.prisma.routeSchedule.createMany({
        data: schedules.map((s) => ({
          routeId,
          days: s.days.join(','),
          time: s.time,
          label: s.label ?? null,
        })),
      });
    }
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

    if (dto.schedules && dto.schedules.length > 0) {
      await this.replaceSchedules(route.id, dto.schedules);
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

    if (dto.schedules !== undefined) {
      await this.replaceSchedules(id, dto.schedules);
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
                select: {
                  id: true,
                  name: true,
                  address: true,
                  latitude: true,
                  longitude: true,
                  scheduledTime: true,
                },
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
          frequency: r.frequency,
          shift: r.shift,
          totalStops: r.stops.length,
          stops: r.stops.map((s) => ({
            id: s.id,
            pickupPoint: s.pickupPoint,
            orderIndex: s.orderIndex,
            status: s.status,
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
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    // Un conductor puede tener varias rutas (zonas/turnos) a su cargo. Se
    // incluyen tambien las completadas HOY para que pueda ver el check de
    // "ya lo hice" en vez de que desaparezcan de la lista apenas terminan.
    const routes = await this.prisma.route.findMany({
      where: {
        driverId,
        OR: [
          { status: { in: ['PENDING', 'IN_PROGRESS'] } },
          { status: 'COMPLETED', finishedAt: { gte: startOfToday } },
        ],
      },
      include: routeInclude,
      orderBy: { createdAt: 'desc' },
    });

    const latestByRoute = await this.latestLocationsByRoute(
      routes.filter((r) => r.status === 'IN_PROGRESS').map((r) => r.id),
    );

    return routes
      .map((r) => ({
        ...mapRouteSchedules(r),
        totalStops: r.stops.length,
        completedStops: r.stops.filter((s) => s.status === 'COMPLETED').length,
        currentLocation: latestByRoute.get(r.id) ?? null,
      }))
      // Ordenadas por hora del turno (mañana → tarde → noche → dominical),
      // no por fecha de creación, para que el conductor las vea en el orden
      // en que efectivamente le tocan durante el día.
      .sort((a, b) => (SHIFT_ORDER[a.shift ?? ''] ?? 99) - (SHIFT_ORDER[b.shift ?? ''] ?? 99));
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
    // Mientras corre una demo para esta ruta, se ignora el GPS real para que
    // no interfiera con el trayecto simulado (p. ej. si el conductor deja
    // abierta la pestaña del mapa con su ubicación real activa).
    if (this.demoState.isActive(routeId)) {
      return { ignored: true, reason: 'Demo en curso para esta ruta' };
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

  async findPublic() {
    const routes = await this.prisma.route.findMany({
      select: {
        id: true,
        name: true,
        shift: true,
        frequency: true,
        zone: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return routes.map((r) => ({
      id: r.id,
      name: r.name ?? `Ruta ${r.zone?.name ?? 'Sin zona'} - ${r.shift || ''} (${r.frequency || ''})`,
      zoneId: r.zone?.id,
      zoneName: r.zone?.name,
    }));
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

  async remove(id: string) {
    const route = await this.prisma.route.findUnique({
      where: { id },
      include: { stops: { include: { collection: true } } },
    });

    if (!route) throw new NotFoundException('Ruta no encontrada');
    if (route.status === 'IN_PROGRESS') {
      throw new ConflictException('No se puede eliminar una ruta en curso');
    }

    await this.prisma.$transaction(async (tx) => {
      // Eliminar colecciones asociadas a las paradas
      const collectionIds = route.stops
        .map((s) => s.collection?.id)
        .filter(Boolean) as string[];
      if (collectionIds.length > 0) {
        await tx.collection.deleteMany({
          where: { id: { in: collectionIds } },
        });
      }

      // Eliminar paradas
      await tx.routeStop.deleteMany({ where: { routeId: id } });

      // Eliminar ubicaciones GPS
      await tx.routeLocation.deleteMany({ where: { routeId: id } });

      // Eliminar alarmas ciudadanas (tienen routeId no-nullable)
      await tx.citizenAlarm.deleteMany({ where: { routeId: id } });

      // Desvincular incidencias (routeId es nullable)
      await tx.incident.updateMany({
        where: { routeId: id },
        data: { routeId: null },
      });

      // Eliminar la ruta
      await tx.route.delete({ where: { id } });
    });

    return { success: true, id };
  }
}
