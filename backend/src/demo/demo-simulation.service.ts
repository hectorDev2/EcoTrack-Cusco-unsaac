import {
  Injectable,
  Logger,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RoutesService } from '../routes/routes.service';
import { NotificationsService } from '../notifications/notifications.service';
import { DemoStateService } from './demo-state.service';
import { StartDemoDto } from './dto/start-demo.dto';
import {
  fetchRoadPath,
  buildLinearPath,
  densifyPath,
  pathIndexAtDistance,
  haversineMeters,
  type LatLng,
} from './osrm.util';

interface StopMarker {
  stopId: string;
  pickupPointId: string;
}

interface SimulationState {
  intervalId: NodeJS.Timeout;
  path: LatLng[];
  // índice de path -> paradas reales. Es un array y no un único StopMarker
  // porque dos paradas cercanas entre sí pueden redondear al MISMO índice
  // al densificar (ver pathIndexAtDistance) — con un Map<number,
  // StopMarker> la segunda pisaba a la primera y esa parada nunca se
  // marcaba COMPLETED ni notificaba, dando la sensación de que el camión
  // "saltaba" de una parada a otra bastante más adelante en el orden.
  stopByPathIndex: Map<number, StopMarker[]>;
  notifiedStopIds: Set<string>;
  currentIndex: number;
}

const DEFAULT_DURATION_SECONDS = 150;
// Paso (m) entre puntos del trayecto simulado. Corto para que cada posición
// caiga sobre la calle real giro por giro y la recta que el frontend traza
// entre dos posiciones no corte una esquina. Los vértices de OSRM (las
// esquinas) se preservan siempre; esto solo subdivide los tramos rectos.
const STEP_METERS = 20;
// Cota del tick para no saturar de escrituras ni ir demasiado lento cuando
// la ruta es muy larga o muy corta (el tick se calcula para que la demo dure
// ~durationSeconds sobre la cantidad de puntos densificados).
const MIN_TICK_SECONDS = 0.8;
const MAX_TICK_SECONDS = 3;

@Injectable()
export class DemoSimulationService {
  private readonly logger = new Logger(DemoSimulationService.name);
  private simulations = new Map<string, SimulationState>();

  constructor(
    private prisma: PrismaService,
    private routesService: RoutesService,
    private notifications: NotificationsService,
    private demoState: DemoStateService,
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
    const rawPath = roadPath?.coordinates ?? buildLinearPath(waypoints);

    // Distancia acumulada de cada parada desde el inicio de la ruta, EN EL
    // ORDEN en que se visitan. Se calcula a partir de las distancias reales
    // por tramo que ya devuelve OSRM (`legs[].distance`) o, si no hay OSRM,
    // sumando la distancia en línea recta entre paradas consecutivas — no se
    // busca "el punto más cercano" del trayecto, porque en una cuadrícula de
    // calles eso puede confundirse con un tramo distinto y desordenar el
    // recorrido (una parada "más adelante" podría coincidir por cercanía con
    // un tramo anterior).
    const waypointDistances: number[] = [0];
    if (roadPath) {
      for (const legDist of roadPath.legDistances) {
        waypointDistances.push(waypointDistances[waypointDistances.length - 1] + legDist);
      }
    } else {
      for (let i = 1; i < waypoints.length; i++) {
        waypointDistances.push(
          waypointDistances[waypointDistances.length - 1] + haversineMeters(waypoints[i - 1], waypoints[i]),
        );
      }
    }

    const durationSeconds = dto.durationSeconds ?? DEFAULT_DURATION_SECONDS;

    // Trayecto denso que preserva TODAS las esquinas (ver densifyPath). La
    // cantidad de puntos la fija la longitud real de la ruta, no un número
    // fijo, así que una ruta con muchos giros nunca se ve "recortada".
    const path = densifyPath(rawPath, STEP_METERS);

    // El tick se ajusta para que recorrer todos los puntos tome ~durationSeconds,
    // acotado para no saturar de escrituras ni arrastrarse. Si el DTO lo fija a
    // mano, ese valor manda.
    const tickSeconds =
      dto.tickSeconds ??
      Math.min(MAX_TICK_SECONDS, Math.max(MIN_TICK_SECONDS, durationSeconds / path.length));

    const stopByPathIndex = new Map<number, StopMarker[]>();
    route.stops.forEach((s, i) => {
      const newIndex = pathIndexAtDistance(path, waypointDistances[i]);
      const marker: StopMarker = { stopId: s.id, pickupPointId: s.pickupPoint.id };
      const existing = stopByPathIndex.get(newIndex);
      if (existing) existing.push(marker);
      else stopByPathIndex.set(newIndex, [marker]);
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
    this.demoState.markActive(routeId);

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

    const stopMarkers = state.stopByPathIndex.get(state.currentIndex);
    if (stopMarkers) {
      for (const stopMarker of stopMarkers) {
        if (state.notifiedStopIds.has(stopMarker.pickupPointId)) continue;
        state.notifiedStopIds.add(stopMarker.pickupPointId);
        await this.prisma.routeStop.update({
          where: { id: stopMarker.stopId },
          data: { status: 'COMPLETED' },
        });
        await this.notifyAlarms(routeId, stopMarker.pickupPointId);
      }
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
    this.demoState.markInactive(routeId);
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
