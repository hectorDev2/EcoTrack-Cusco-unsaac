import {
  Controller,
  Param,
  Query,
  Sse,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Observable, interval, map, merge } from 'rxjs';
import { Public } from '../common/decorators/public.decorator';
import { LiveEventsService } from './live-events.service';

/** Formato que espera Nest para un stream SSE (`data` se manda como texto). */
interface SseMessage {
  data: string;
}

@Controller('live')
export class LiveController {
  constructor(
    private readonly live: LiveEventsService,
    private readonly jwt: JwtService,
  ) {}

  /**
   * Stream en vivo (SSE) de la ruta `id`: posición del camión, paradas
   * completadas y estado de la demo. Lo consumen los 3 roles a la vez.
   *
   * Es `@Public()` porque `EventSource` del navegador no puede mandar el
   * header Authorization — el JWT viaja por query param y se valida acá a mano.
   */
  @Public()
  @Sse('routes/:id')
  stream(
    @Param('id') id: string,
    @Query('token') token: string,
  ): Observable<SseMessage> {
    try {
      this.jwt.verify(token);
    } catch {
      throw new UnauthorizedException('Token inválido o ausente');
    }

    const events = this.live
      .stream(id)
      .pipe(map((event) => ({ data: JSON.stringify(event) })));

    // Latido cada 20s: mantiene viva la conexión y le permite al navegador
    // detectar una caída (si no llegan ni latidos, reconecta solo).
    const heartbeat = interval(20_000).pipe(
      map(() => ({ data: JSON.stringify({ type: 'ping' }) })),
    );

    return merge(events, heartbeat);
  }
}
