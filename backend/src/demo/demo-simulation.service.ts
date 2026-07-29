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
import { LiveEventsService } from '../live/live-events.service';
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
  name: string;
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
  // Cuántos puntos del path avanza el camión en cada tick. Se calcula para
  // que la ruta entera tarde ~durationSeconds SIN atar la cadencia de ticks
  // (y de escrituras) a la densidad del path: un path denso (muchas esquinas)
  // con un tick fijo daría una demo larguísima, y uno con tick muy corto
  // saturaría de escrituras. Avanzar >1 punto por tick desacopla ambas cosas.
  pointsPerTick: number;
}

// Paso (m) entre puntos del trayecto simulado. Corto para que cada posición
// caiga sobre la calle real giro por giro; los vértices de OSRM (las esquinas)
// se preservan siempre, esto solo subdivide los tramos rectos largos.
const STEP_METERS = 20;

/** Distancia total en línea recta entre waypoints consecutivos. */
function straightLineDistance(waypoints: LatLng[]): number {
  let total = 0;
  for (let i = 1; i < waypoints.length; i++) {
    total += haversineMeters(waypoints[i - 1], waypoints[i]);
  }
  return total;
}

/** Distancia acumulada de cada waypoint (línea recta). */
function straightLineWaypointDistances(waypoints: LatLng[]): number[] {
  const dists: number[] = [0];
  for (let i = 1; i < waypoints.length; i++) {
    dists.push(dists[i - 1] + haversineMeters(waypoints[i - 1], waypoints[i]));
  }
  return dists;
}
// Cadencia fija de ticks (escritura de posición + chequeo de paradas). El
// avance por tick (pointsPerTick) se ajusta a la longitud de la ruta.
const DEFAULT_TICK_SECONDS = 1.2;
// Velocidad simulada objetivo. La duración se deriva de la longitud real de
// la ruta para que el camión avance a un ritmo parejo y seguible en vez de
// "volar" en rutas largas (una ruta de ~9 km a 150 s iba a >200 km/h).
const DEMO_SPEED_MPS = 12; // ~43 km/h
const MIN_DURATION_SECONDS = 60;
const MAX_DURATION_SECONDS = 300; // tope para que una ruta larga no sea eterna

@Injectable()
export class DemoSimulationService {
  private readonly logger = new Logger(DemoSimulationService.name);
  private simulations = new Map<string, SimulationState>();

  constructor(
    private prisma: PrismaService,
    private routesService: RoutesService,
    private notifications: NotificationsService,
    private demoState: DemoStateService,
    private live: LiveEventsService,
  ) {}

  async startDemo(routeId: string, driverId: string, dto: StartDemoDto) {
    const route = await this.routesService.findForDemo(routeId);

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

    // Borrar el rastro de posiciones de corridas anteriores: si no, la tabla
    // routeLocation crece sin límite demo tras demo (cada tick agrega una
    // fila) y el rastro viejo se mezcla con el nuevo en el mapa.
    await this.prisma.routeLocation.deleteMany({ where: { routeId } });

    const waypoints: LatLng[] = route.stops.map((s) => ({
      lat: s.pickupPoint.latitude,
      lng: s.pickupPoint.longitude,
    }));

    // FASE 1: arrancar la demo INMEDIATAMENTE con trazado lineal entre
    // paradas. El POST responde en ~3-5s (findForDemo + cleanup + lineal)
    // en vez de 15-27s (esperando OSRM). El trazado por calles reales se
    // mejora en FASE 2 en segundo plano.
    const totalDistance = straightLineDistance(waypoints);
    const durationSeconds =
      dto.durationSeconds ??
      Math.min(
        MAX_DURATION_SECONDS,
        Math.max(MIN_DURATION_SECONDS, totalDistance / DEMO_SPEED_MPS),
      );
    const tickSeconds = dto.tickSeconds ?? DEFAULT_TICK_SECONDS;

    const linearPath = buildLinearPath(waypoints);
    const path = densifyPath(linearPath, STEP_METERS);
    const waypointDistances = straightLineWaypointDistances(waypoints);

    this.startSimulation(routeId, route.stops, path, waypointDistances, durationSeconds, tickSeconds, 'lineal');

    // FASE 2: mejorar el trazado con OSRM en segundo plano. Si OSRM responde
    // (normalmente 2-5s), el path se reemplaza y la simulación continúa
    // desde el índice equivalente — el conductor ni se entera.
    this.fetchAndUpgradePath(routeId, waypoints, route.stops, durationSeconds, tickSeconds).catch((err) =>
      this.logger.warn(`Demo ${routeId}: fallo al mejorar trazado con OSRM: ${err instanceof Error ? err.message : err}`),
    );

    return { started: true };
  }

  /** Crea la simulación con el path, stop indices e intervalo dados. */
  private startSimulation(
    routeId: string,
    stops: { id: string; pickupPoint: { id: string; name: string } }[],
    path: LatLng[],
    waypointDistances: number[],
    durationSeconds: number,
    tickSeconds: number,
    source: string,
  ) {
    const totalTicks = Math.max(1, Math.round(durationSeconds / tickSeconds));
    const pointsPerTick = Math.max(1, Math.ceil(path.length / totalTicks));
    const totalDistance = waypointDistances[waypointDistances.length - 1];

    const stopByPathIndex = new Map<number, StopMarker[]>();
    stops.forEach((s, i) => {
      const newIndex = pathIndexAtDistance(path, waypointDistances[i]);
      const marker: StopMarker = {
        stopId: s.id,
        pickupPointId: s.pickupPoint.id,
        name: s.pickupPoint.name,
      };
      const existing = stopByPathIndex.get(newIndex);
      if (existing) existing.push(marker);
      else stopByPathIndex.set(newIndex, [marker]);
    });

    this.clearSimulation(routeId);

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
      pointsPerTick,
    });
    this.demoState.markActive(routeId);
    this.live.emit(routeId, { type: 'status', running: true });

    this.logger.log(
      `Demo iniciada para ruta ${routeId}: ${path.length} puntos, ${Math.round(totalDistance)}m, ` +
        `~${Math.round(durationSeconds)}s, tick=${tickSeconds}s x${pointsPerTick}pt (${source})`,
    );
  }

  /**
   * FASE 2: busca el trazado OSRM en background y reemplaza el path lineal
   * de la simulación si OSRM responde a tiempo.
   */
  private async fetchAndUpgradePath(
    routeId: string,
    waypoints: LatLng[],
    stops: { id: string; pickupPoint: { id: string; name: string } }[],
    durationSeconds: number,
    tickSeconds: number,
  ) {
    const roadPath = await fetchRoadPath(waypoints);
    const state = this.simulations.get(routeId);
    if (!roadPath || !state) return;

    // Calcular distancia y duración real con OSRM
    const osrmDistance = roadPath.legDistances.reduce((a, b) => a + b, 0);
    const osrmDuration = Math.min(
      MAX_DURATION_SECONDS,
      Math.max(MIN_DURATION_SECONDS, osrmDistance / DEMO_SPEED_MPS),
    );

    // El progreso lineal actual como fracción (0..1)
    const progress = state.path.length > 0 ? state.currentIndex / state.path.length : 0;
    const rawPath = roadPath.coordinates;
    const newPath = densifyPath(rawPath, STEP_METERS);

    // Distancias acumuladas de cada parada en el trayecto OSRM
    const newWaypointDistances: number[] = [0];
    for (const legDist of roadPath.legDistances) {
      newWaypointDistances.push(newWaypointDistances[newWaypointDistances.length - 1] + legDist);
    }

    // Mapa de stop indices para el nuevo path
    const newStopByPathIndex = new Map<number, StopMarker[]>();
    stops.forEach((s, i) => {
      const newIndex = pathIndexAtDistance(newPath, newWaypointDistances[i]);
      const marker: StopMarker = {
        stopId: s.id,
        pickupPointId: s.pickupPoint.id,
        name: s.pickupPoint.name,
      };
      const existing = newStopByPathIndex.get(newIndex);
      if (existing) existing.push(marker);
      else newStopByPathIndex.set(newIndex, [marker]);
    });

    // Índice equivalente en el nuevo path (misma fracción de progreso)
    const newIndex = Math.min(Math.round(progress * newPath.length), newPath.length - 1);

    const pointsPerTick = Math.max(1, Math.ceil(newPath.length / Math.max(1, Math.round(osrmDuration / tickSeconds))));

    // Reemplazar path atómicamente
    state.path = newPath;
    state.stopByPathIndex = newStopByPathIndex;
    state.currentIndex = newIndex;
    state.pointsPerTick = pointsPerTick;

    this.logger.log(
      `Demo ${routeId}: trazado mejorado con OSRM (${newPath.length} pts, ${Math.round(osrmDistance)}m, ` +
        `progreso ${Math.round(progress * 100)}%)`,
    );
  }

  private async tick(routeId: string) {
    const state = this.simulations.get(routeId);
    if (!state) return;

    if (state.currentIndex >= state.path.length) {
      this.clearSimulation(routeId);
      this.logger.log(`Demo de ruta ${routeId} completada`);
      return;
    }

    // Avanzar pointsPerTick de una — pero SIN saltarse el chequeo de las
    // paradas que caen en los índices intermedios (si no, en una ruta larga
    // con avance >1 el camión pasaría por una parada sin marcarla).
    const from = state.currentIndex;
    const to = Math.min(from + state.pointsPerTick, state.path.length) - 1;
    const point = state.path[to];

    // Avanzar el índice YA, antes de tocar Turso. Si una escritura falla o
    // tarda (Turso es remoto y a veces se cae), la simulación NO debe quedarse
    // congelada emitiendo el mismo punto una y otra vez — eso se veía como el
    // camión "clavado" sin recorrer la ruta.
    state.currentIndex = to + 1;

    // Detectar las paradas alcanzadas en este rango (marcado en memoria para
    // no reprocesarlas si un reintento vuelve a caer acá).
    const reachedStops: StopMarker[] = [];
    for (let idx = from; idx <= to; idx++) {
      const markers = state.stopByPathIndex.get(idx);
      if (!markers) continue;
      for (const marker of markers) {
        if (state.notifiedStopIds.has(marker.pickupPointId)) continue;
        state.notifiedStopIds.add(marker.pickupPointId);
        reachedStops.push(marker);
      }
    }

    // 1) Empujar posición + checks a todos los que miran (admin, conductor,
    //    ciudadano) — instantáneo, sin pasar por Turso. Esto es lo que mueve
    //    el camión y pinta las paradas en vivo en las 3 vistas.
    this.live.emit(routeId, {
      type: 'position',
      lat: point.lat,
      lng: point.lng,
      index: to,
      total: state.path.length,
    });
    for (const stop of reachedStops) {
      this.live.emit(routeId, {
        type: 'stop',
        stopId: stop.stopId,
        pickupPointId: stop.pickupPointId,
        name: stop.name,
      });
    }

    // 2) Persistir (best-effort, fire-and-forget): un fallo de Turso se
    //    registra pero NO corta la simulación ni congela el camión.
    this.prisma.routeLocation.create({
      data: { routeId, latitude: point.lat, longitude: point.lng, simulated: true },
    }).catch((err: unknown) => {
      this.logger.warn(`Demo ${routeId}: fallo al persistir posición: ${err instanceof Error ? err.message : err}`);
    });

    for (const stop of reachedStops) {
      this.prisma.routeStop.update({
        where: { id: stop.stopId },
        data: { status: 'COMPLETED' },
      }).catch((err: unknown) => {
        this.logger.warn(`Demo ${routeId}: fallo al persistir parada ${stop.stopId}: ${err instanceof Error ? err.message : err}`);
      });
      this.notifyAlarms(routeId, stop.pickupPointId).catch((err: unknown) => {
        this.logger.warn(`Demo ${routeId}: fallo al notificar alarma: ${err instanceof Error ? err.message : err}`);
      });
    }
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
    const route = await this.routesService.findForDemo(routeId);
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
    this.live.emit(routeId, { type: 'status', running: false });
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
