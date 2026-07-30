import { Injectable } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';

/**
 * Evento que se empuja en vivo (vía SSE) a todos los que están mirando una
 * ruta — sin importar el rol (admin en la flota, conductor en su mapa,
 * ciudadano en el suyo). Es un push server→cliente: nadie hace polling a
 * Turso para ver moverse el camión.
 */
export type LiveEvent =
  | { type: 'position'; lat: number; lng: number; index: number; total: number }
  | { type: 'stop'; stopId: string; pickupPointId: string; name: string }
  | { type: 'status'; running: boolean }
  // Aviso anticipado ("el camión está a N paradas de tu casa"). Se emite en el
  // canal de la ruta con el userId destinatario; cada cliente filtra por su
  // usuario. name = nombre del punto de recojo más cercano a la casa.
  | { type: 'alarm'; userId: string; name: string; stopsAway: number };

/**
 * Un canal (Subject de RxJS) por ruta. El servicio de simulación empuja
 * eventos con `emit()` y cada suscriptor SSE los recibe al instante. Vive en
 * su propio módulo (como DemoStateService) para que tanto la demo como el
 * controller SSE lo compartan sin dependencias circulares.
 */
@Injectable()
export class LiveEventsService {
  private channels = new Map<string, Subject<LiveEvent>>();

  private channel(routeId: string): Subject<LiveEvent> {
    let subject = this.channels.get(routeId);
    if (!subject) {
      subject = new Subject<LiveEvent>();
      this.channels.set(routeId, subject);
    }
    return subject;
  }

  stream(routeId: string): Observable<LiveEvent> {
    return this.channel(routeId).asObservable();
  }

  emit(routeId: string, event: LiveEvent): void {
    this.channel(routeId).next(event);
  }
}
