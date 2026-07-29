import { Module } from '@nestjs/common';
import { LiveController } from './live.controller';
import { LiveEventsService } from './live-events.service';

/**
 * Canal de eventos en vivo (SSE). Exporta LiveEventsService para que la demo
 * (y a futuro el GPS real) puedan empujar posiciones sin acoplarse al
 * controller. JwtService ya es global (JwtModule.register({ global: true })).
 */
@Module({
  controllers: [LiveController],
  providers: [LiveEventsService],
  exports: [LiveEventsService],
})
export class LiveModule {}
