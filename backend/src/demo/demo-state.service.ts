import { Injectable } from '@nestjs/common';

/**
 * Registro compartido de qué rutas tienen una demo corriendo ahora mismo.
 * Vive en un módulo aparte (sin depender de RoutesModule ni de DemoModule)
 * para que ambos puedan consultarlo sin generar una dependencia circular.
 */
@Injectable()
export class DemoStateService {
  private activeRouteIds = new Set<string>();

  markActive(routeId: string) {
    this.activeRouteIds.add(routeId);
  }

  markInactive(routeId: string) {
    this.activeRouteIds.delete(routeId);
  }

  isActive(routeId: string): boolean {
    return this.activeRouteIds.has(routeId);
  }
}
