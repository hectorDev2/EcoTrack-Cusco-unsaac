import { Injectable, CanActivate, ForbiddenException } from '@nestjs/common';

@Injectable()
export class DemoModeGuard implements CanActivate {
  canActivate(): boolean {
    // Activado por defecto — se desactiva explícitamente con "false" en .env
    if (process.env.DEMO_MODE_ENABLED === 'false') {
      throw new ForbiddenException('Modo demo no habilitado en este entorno');
    }
    return true;
  }
}
