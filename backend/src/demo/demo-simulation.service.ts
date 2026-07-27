import {
  Injectable,
  Logger,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RoutesService } from '../routes/routes.service';
import { NotificationsService } from '../notifications/notifications.service';
import { StartDemoDto } from './dto/start-demo.dto';
import {
  fetchRoadPath,
  buildLinearPath,
  nearestPathIndex,
  resamplePath,
  mapIndexAfterResample,
  type LatLng,
} from './osrm.util';

interface StopMarker {
  stopId: string;
  pickupPointId: string;
}

interface SimulationState {
  intervalId: NodeJS.Timeout;
  path: LatLng[];
  stopByPathIndex: Map<number, StopMarker>; // índice de path -> parada real
  notifiedStopIds: Set<string>;
  currentIndex: number;
}

const DEFAULT_DURATION_SECONDS = 120;
const DEFAULT_TICK_SECONDS = 3;

@Injectable()
export class DemoSimulationService {
  private readonly logger = new Logger(DemoSimulationService.name);
  private simulations = new Map<string, SimulationState>();

  constructor(
    private prisma: PrismaService,
    private routesService: RoutesService,
    private notifications: NotificationsService,
  ) {}

  async startDemo(routeId: string, driverId: string, dto: StartDemoDto) {
    const route = await this.routesService.findOne(routeId);

    if (route.driverId !== driverId) {
      throw new ForbiddenException('Esta ruta no te pertenece');
    }
    if (route.status !== 'IN_PROGRESS') {
      throw new BadRequestException(
        'Primero inicia la ruta antes de arrancar la demo',
      );
    }
    if (route.stops.length < 2) {
      throw new BadRequestException(
        'La ruta necesita al menos 2 paradas para simular movimiento',
      );
    }

    // Si ya había una simulación corriendo para esta ruta, se reinicia.
    this.clearSimulation(routeId);

    // Reiniciar el estado de las paradas para poder repetir la demo desde cero.
    await this.prisma.routeStop.updateMany({
      where: { routeId },
      data: { status: 'PENDING' },
    });

    const waypoints: LatLng[] = route.stops.map((s) => ({
      lat: s.pickupPoint.latitude,
      lng: s.pickupPoint.longitude,
    }));

    const roadPath = await fetchRoadPath(waypoints);
    const rawPath = roadPath ?? buildLinearPath(waypoints);

    // Mapear cada parada real al índice más cercano dentro del trayecto denso.
    const stopByRawIndex = new Map<number, StopMarker>();
    route.stops.forEach((s) => {
      const target: LatLng = { lat: s.pickupPoint.latitude, lng: s.pickupPoint.longitude };
      const idx = nearestPathIndex(rawPath, target);
      stopByRawIndex.set(idx, { stopId: s.id, pickupPointId: s.pickupPoint.id });
    });

    const tickSeconds = dto.tickSeconds ?? DEFAULT_TICK_SECONDS;
    const durationSeconds = dto.durationSeconds ?? DEFAULT_DURATION_SECONDS;
    const totalTicks = Math.max(2, Math.floor(durationSeconds / tickSeconds));

    const path = resamplePath(rawPath, totalTicks);
    const stopByPathIndex = new Map<number, StopMarker>();
    stopByRawIndex.forEach((marker, rawIndex) => {
      const newIndex = mapIndexAfterResample(rawIndex, rawPath.length, path.length);
      stopByPathIndex.set(newIndex, marker);
    });

    const intervalId = setInterval(() => {
      this.tick(routeId).catch((err) =>
        this.logger.error(`Error en tick de demo ${routeId}: ${err instanceof Error ? err.message : err}`),
      );
    }, tickSeconds * 1000);

    this.simulations.set(routeId, {
      intervalId,
      path,
      stopByPathIndex,
      notifiedStopIds: new Set(),
      currentIndex: 0,
    });

    this.logger.log(
      `Demo iniciada para ruta ${routeId}: ${path.length} puntos, tick=${tickSeconds}s (${roadPath ? 'OSRM' : 'lineal'})`,
    );

    return { started: true, totalTicks: path.length, tickSeconds };
  }

  private async tick(routeId: string) {
    const state = this.simulations.get(routeId);
    if (!state) return;

    if (state.currentIndex >= state.path.length) {
      this.clearSimulation(routeId);
      this.logger.log(`Demo de ruta ${routeId} completada`);
      return;
    }

    const point = state.path[state.currentIndex];
    await this.prisma.routeLocation.create({
      data: { routeId, latitude: point.lat, longitude: point.lng, simulated: true },
    });

    const stopMarker = state.stopByPathIndex.get(state.currentIndex);
    if (stopMarker && !state.notifiedStopIds.has(stopMarker.pickupPointId)) {
      state.notifiedStopIds.add(stopMarker.pickupPointId);
      await this.prisma.routeStop.update({
        where: { id: stopMarker.stopId },
        data: { status: 'COMPLETED' },
      });
      await this.notifyAlarms(routeId, stopMarker.pickupPointId);
    }

    state.currentIndex++;
  }

  private async notifyAlarms(routeId: string, pickupPointId: string) {
    const alarms = await this.prisma.citizenAlarm.findMany({
      where: { routeId, pickupPointId, active: true },
      include: { user: { select: { phone: true } }, pickupPoint: { select: { name: true } } },
    });

    for (const alarm of alarms) {
      if (!alarm.user.phone) continue;
      const message = `🎬 [DEMO] Eco Track Wanchaq: el camión (simulado) acaba de pasar por "${alarm.pickupPoint.name}".`;
      await this.notifications.sendWhatsapp(alarm.user.phone, message);
    }
  }

  async stopDemo(routeId: string, driverId: string) {
    const route = await this.routesService.findOne(routeId);
    if (route.driverId !== driverId) {
      throw new ForbiddenException('Esta ruta no te pertenece');
    }
    this.clearSimulation(routeId);
    return { stopped: true };
  }

  private clearSimulation(routeId: string) {
    const state = this.simulations.get(routeId);
    if (state) {
      clearInterval(state.intervalId);
      this.simulations.delete(routeId);
    }
  }

  getStatus(routeId: string) {
    const state = this.simulations.get(routeId);
    if (!state) return { running: false };
    return {
      running: true,
      currentIndex: state.currentIndex,
      totalTicks: state.path.length,
      progressPercent: Math.round((state.currentIndex / state.path.length) * 100),
    };
  }
}
