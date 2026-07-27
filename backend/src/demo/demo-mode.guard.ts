import { Injectable, CanActivate, ForbiddenException } from '@nestjs/common';

@Injectable()
export class DemoModeGuard implements CanActivate {
  canActivate(): boolean {
    if (process.env.DEMO_MODE_ENABLED !== 'true') {
      throw new ForbiddenException('Modo demo no habilitado en este entorno');
    }
    return true;
  }
}
